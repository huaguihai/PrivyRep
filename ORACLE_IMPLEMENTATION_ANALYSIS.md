# Zamabelief Oracle 回调机制深度分析

## ✅ 分析日期：2025-10-28
## 📂 源码：Zamabelief/contracts/BeliefMarket.sol

---

## 1. 核心发现总结

### 1.1 技术栈

| 组件 | Zamabelief 使用的版本 | 我们当前的版本 | 是否一致 |
|------|---------------------|--------------|----------|
| @fhevm/solidity | ^0.8.0 | ✅ 一致 | ✅ |
| @zama-fhe/relayer-sdk | ^0.2.0 | ✅ 一致 | ✅ |
| ethers | ^5.8.0 | ✅ 一致 | ✅ |
| Solidity | 0.8.24 | ✅ 一致 | ✅ |
| @zama-fhe/oracle-solidity | ^0.1.0 | ❌ **缺失** | ⚠️ |
| @fhevm/hardhat-plugin | (使用中) | ❌ **缺失** | ⚠️ |

**关键发现：** Zamabelief 使用了额外的 `@zama-fhe/oracle-solidity` 包，我们没有。

---

## 2. Oracle 回调机制的完整实现

### 2.1 合约继承

```solidity
// Zamabelief 的做法
import { FHE, externalEuint64, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract BeliefMarketFHE is SepoliaConfig {
    // 只需要继承 SepoliaConfig，不需要额外的 Gateway 基类
}
```

**关键点：**
- ✅ 只继承 `SepoliaConfig`
- ✅ 不需要继承 `GatewayCaller` 或其他 Gateway 基类
- ✅ `SepoliaConfig` 已经包含了所有必要的 Gateway 配置

---

### 2.2 请求解密的完整流程

**代码位置：** BeliefMarket.sol:135-151

```solidity
// Step 1: 准备要解密的加密值
function requestTallyReveal(string memory betId) external {
    BetInfo storage bet = bets[betId];

    // 基础验证
    require(bet.creator != address(0), "Bet doesn't exist");
    require(block.timestamp >= bet.expiryTime, "Bet not expired");
    require(!bet.isResolved, "Already resolved");
    require(msg.sender == bet.creator, "Only creator can request reveal");

    // Step 2: 将加密值转换为 bytes32 数组
    bytes32[] memory cts = new bytes32[](2);
    cts[0] = FHE.toBytes32(bet.yesVotes);  // 第一个加密值
    cts[1] = FHE.toBytes32(bet.noVotes);   // 第二个加密值

    // Step 3: 请求解密，指定回调函数
    uint256 requestId = FHE.requestDecryption(
        cts,                                          // 要解密的加密值数组
        this.resolveTallyCallback.selector           // 回调函数的 selector
    );

    // Step 4: 存储 requestId，用于回调时识别
    bet.decryptionRequestId = requestId;
    betIdByRequestId[requestId] = betId;

    emit TallyRevealRequested(betId, requestId);
}
```

**关键技术点：**

1. **FHE.toBytes32()** - 将 euint64/euint32 转换为 bytes32
2. **FHE.requestDecryption()** - 向 Oracle 请求解密
   - 参数 1：bytes32[] 数组（加密值列表）
   - 参数 2：回调函数的 selector
   - 返回：uint256 requestId
3. **requestId 映射** - 必须建立 requestId → 业务 ID 的映射

---

### 2.3 回调函数的完整实现

**代码位置：** BeliefMarket.sol:153-174

```solidity
// FHEVM 0.8.0 的回调函数签名（最新版本）
function resolveTallyCallback(
    uint256 requestId,                    // Oracle 传入的请求 ID
    bytes memory cleartexts,              // 解密后的明文（ABI 编码）
    bytes memory decryptionProof          // 解密证明（用于验证）
) external {
    // ⭐ Step 1: 验证解密结果的合法性（防止伪造）
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);

    // ⭐ Step 2: 解码明文数据
    // 注意：解码的类型必须与请求时的加密值类型一致
    (uint64 revealedYes, uint64 revealedNo) = abi.decode(
        cleartexts,
        (uint64, uint64)  // 对应 euint64 → uint64
    );

    // ⭐ Step 3: 通过 requestId 找到对应的业务数据
    string memory betId = betIdByRequestId[requestId];
    BetInfo storage bet = bets[betId];

    // ⭐ Step 4: 更新业务状态
    bet.revealedYes = revealedYes;
    bet.revealedNo = revealedNo;
    bet.isResolved = true;
    bet.yesWon = revealedYes > revealedNo;

    // ⭐ Step 5: 设置回调标志（可选，用于前端查询）
    callbackHasBeenCalled[betId] = true;

    emit BetResolved(betId, bet.yesWon, revealedYes, revealedNo, bet.prizePool);
}
```

**回调函数关键要点：**

1. **函数签名必须完全匹配：**
   ```solidity
   function yourCallback(
       uint256 requestId,
       bytes memory cleartexts,
       bytes memory decryptionProof
   ) external
   ```

2. **安全验证：** 必须调用 `FHE.checkSignatures()` 防止伪造

3. **解码规则：**
   - euint32 → uint32
   - euint64 → uint64
   - ebool → bool
   - 多个值时按请求顺序解码

4. **权限控制：** ⚠️ 回调函数是 `external`，任何人都可以调用
   - Zamabelief 没有 `onlyGateway` 修饰符
   - 安全性依赖 `FHE.checkSignatures()` 验证

---

## 3. 数据结构设计

### 3.1 请求追踪

```solidity
// 业务数据结构
struct VerificationTask {
    address user;
    uint32 minAssetBalance;
    uint32 minNFTCount;
    uint32 minAccountAge;
    uint32 minTxCount;
    bool completed;
    bool passed;
    uint256 createdAt;
    uint256 decryptionRequestId;  // ⭐ 新增：存储 Oracle 请求 ID
}

// requestId → taskId 的映射
mapping(uint256 => uint256) internal taskIdByRequestId;

// 回调是否已调用的标志
mapping(uint256 => bool) public callbackCalled;
```

---

## 4. 与我们当前实现的对比

### 4.1 当前实现（需要修改）

```solidity
// ❌ 当前的手动实现
function requestVerification(...) external returns (uint256 taskId) {
    // 创建任务
    verificationTasks[taskId] = VerificationTask({...});

    emit VerificationRequested(taskId, msg.sender);

    // ❌ 没有请求 Oracle 解密
    // ❌ 需要手动调用 completeVerification
}

function completeVerification(
    uint256 taskId,
    bool assetPassed,
    bool nftPassed,
    bool agePassed,
    bool txPassed
) external onlyOwner {
    // ❌ 手动传入解密结果，不安全
}
```

### 4.2 目标实现（参考 Zamabelief）

```solidity
// ✅ 目标：自动 Oracle 回调
function requestVerification(...) external returns (uint256 taskId) {
    // 创建任务
    taskId = taskCounter++;
    verificationTasks[taskId] = VerificationTask({...});

    // ✅ 执行 FHE 比较（链上）
    ebool assetPass = verifyAssetBalance(msg.sender, minAssetBalance);
    ebool nftPass = verifyNFTCount(msg.sender, minNFTCount);
    ebool agePass = verifyAccountAge(msg.sender, minAccountAge);
    ebool txPass = verifyTxCount(msg.sender, minTxCount);

    // ✅ 请求 Oracle 解密
    bytes32[] memory cts = new bytes32[](4);
    cts[0] = FHE.toBytes32(assetPass);
    cts[1] = FHE.toBytes32(nftPass);
    cts[2] = FHE.toBytes32(agePass);
    cts[3] = FHE.toBytes32(txPass);

    uint256 requestId = FHE.requestDecryption(cts, this.verificationCallback.selector);

    verificationTasks[taskId].decryptionRequestId = requestId;
    taskIdByRequestId[requestId] = taskId;

    emit VerificationRequested(taskId, msg.sender, requestId);
}

// ✅ Oracle 自动回调
function verificationCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);

    (bool assetPass, bool nftPass, bool agePass, bool txPass) = abi.decode(
        cleartexts,
        (bool, bool, bool, bool)
    );

    uint256 taskId = taskIdByRequestId[requestId];
    VerificationTask storage task = verificationTasks[taskId];

    bool allPassed = assetPass && nftPass && agePass && txPass;
    task.completed = true;
    task.passed = allPassed;

    if (allPassed) {
        // 自动奖励声誉
        reputationScore.addScore(task.user, REWARD_AMOUNT);
    }

    emit VerificationCompleted(taskId, task.user, allPassed);
}
```

---

## 5. 依赖和配置

### 5.1 需要安装的包

```json
{
  "dependencies": {
    "@fhevm/solidity": "^0.8.0",               // ✅ 已安装
    "@zama-fhe/relayer-sdk": "^0.2.0",         // ✅ 已安装
    "@zama-fhe/oracle-solidity": "^0.1.0"      // ❌ 需要安装
  },
  "devDependencies": {
    "@fhevm/hardhat-plugin": "latest"          // ❌ 需要安装
  }
}
```

### 5.2 Hardhat 配置

```javascript
// hardhat.config.js
require("@fhevm/hardhat-plugin");  // ⭐ 新增

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // ... 其他配置
};
```

---

## 6. 实施步骤（分阶段）

### 阶段 1：准备工作（不修改现有代码）✅ 安全

1. ✅ 创建 Git 分支：`feature/oracle-callback-mechanism`
2. ✅ 安装依赖：`@zama-fhe/oracle-solidity`、`@fhevm/hardhat-plugin`
3. ✅ 更新 hardhat.config.js
4. ✅ 编译测试（确保不破坏现有代码）

### 阶段 2：创建新合约（不修改现有合约）✅ 安全

5. ✅ 创建 `VerificationServiceV2.sol`（新文件）
6. ✅ 实现 Oracle 回调机制
7. ✅ 编写单元测试
8. ✅ 本地测试通过

### 阶段 3：部署和测试（现有合约继续工作）✅ 安全

9. ✅ 部署 V2 合约到 Sepolia
10. ✅ 前端添加 V2 支持（保留 V1 作为备份）
11. ✅ 测试 V2 功能
12. ✅ 确认 Oracle 回调正常工作

### 阶段 4：切换（可回滚）✅ 安全

13. ✅ 前端默认使用 V2
14. ✅ 监控 V2 稳定性
15. ✅ 如有问题，立即回滚到 V1

---

## 7. 风险控制措施

### 7.1 回滚策略

- ✅ V1 合约保持不动
- ✅ V2 作为新合约独立部署
- ✅ 前端通过配置切换 V1/V2
- ✅ 随时可切回 V1

### 7.2 测试检查点

每个阶段完成后，必须确认：
- [ ] 现有功能仍然工作
- [ ] 新功能可以正常编译
- [ ] 单元测试全部通过
- [ ] 前端不会崩溃

**如果任何检查点失败，立即停止并回滚！**

---

## 8. 参考资源

- **Zamabelief 源码：** `Zamabelief/contracts/BeliefMarket.sol`
- **FHEVM 文档：** https://docs.zama.ai/fhevm
- **关键函数：**
  - `FHE.toBytes32()` - 转换加密值
  - `FHE.requestDecryption()` - 请求解密
  - `FHE.checkSignatures()` - 验证解密结果

---

## 9. 下一步行动

1. **Review 这份文档** - 确认技术方案正确
2. **获得批准** - 确认可以开始实施
3. **执行阶段 1** - 安装依赖和配置
4. **逐步推进** - 严格按照阶段执行，不跳步

---

**文档创建时间：** 2025-10-28
**分析者：** Claude Code
**状态：** 待审批
