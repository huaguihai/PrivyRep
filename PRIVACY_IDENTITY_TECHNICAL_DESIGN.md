# PrivyRep - 技术方案设计书

## 1. 系统架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vite + React)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │ Verification │  │ Credentials  │      │
│  │   Component  │  │   Component  │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                          │                                   │
│  ┌──────────────────────┴──────────────────────┐           │
│  │    FHE Service (@zama-fhe/relayer-sdk)      │           │
│  └──────────────────────┬──────────────────────┘           │
└─────────────────────────┼───────────────────────────────────┘
                          │
                    RainbowKit + Wagmi
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Identity     │  │ Reputation   │  │ Verification │
│ Proof        │◄─┤ Score        │◄─┤ Service      │
│ Contract     │  │ Contract     │  │ Contract     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                    FHEVM Network
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │ FHE Gateway  │  │ Zama Oracle  │
        │ (Encryption) │  │ (Decryption) │
        └──────────────┘  └──────────────┘
```

### 1.2 技术栈选型

#### Frontend
- **框架**: Vite 6.0 + React 18 + TypeScript 5.x
- **样式**: TailwindCSS 3.x
- **钱包**: RainbowKit + Wagmi v2
- **FHE SDK**: @zama-fhe/relayer-sdk@0.2.0
- **状态管理**: Zustand (轻量级)
- **路由**: React Router v6

#### Smart Contracts
- **语言**: Solidity ^0.8.24
- **FHE 库**: fhevm-solidity
- **框架**: Hardhat
- **网络**: Sepolia Testnet (开发) → Zama Devnet (生产)

#### Infrastructure
- **RPC**: Multiple fallbacks (Alchemy, PublicNode, BlastAPI)
- **Gateway**: https://gateway.sepolia.zama.ai (chainId: 55815)
- **Oracle**: Zama Oracle (异步解密)

---

## 2. 智能合约设计

### 2.1 合约架构

```
IdentityProofManager (主合约)
    ├── ReputationScore (声誉分数)
    ├── VerificationService (验证服务)
    └── CredentialNFT (证书 SBT)
```

### 2.1.1 FHEVM 类型系统关键点 ⭐

**问题背景：**
在开发过程中，如果合约函数参数使用错误的类型（如 `bytes32`），会导致钱包签名时显示"未知交易类型"和gas估算失败。

**✅ 正确的 FHEVM 类型使用方式（参考 Zamabelief）**

#### 1. 导入正确的类型

```solidity
// ❌ 错误做法：使用旧版本的导入方式
import "@fhevm/solidity/lib/FHE.sol";
import "encrypted-types/EncryptedTypes.sol";

// ✅ 正确做法：从 @fhevm/solidity 导入所有必需类型
import { FHE, externalEuint32, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
```

#### 2. 继承 SepoliaConfig

```solidity
// ❌ 错误做法：不继承基类
contract IdentityProofManager {
    // ...
}

// ✅ 正确做法：继承 SepoliaConfig（Zamabelief 的做法）
contract IdentityProofManager is SepoliaConfig {
    // ...
}
```

#### 3. 函数参数使用 externalEuint* 类型

```solidity
// ❌ 错误做法：使用 bytes32 类型
function registerIdentity(
    bytes32 encryptedAsset,      // ❌ 钱包无法识别
    bytes32 encryptedNFT,
    bytes32 encryptedAge,
    bytes32 encryptedTx,
    bytes calldata inputProof
) external {
    // 需要额外的 wrap 操作
    euint32 asset = FHE.fromExternal(externalEuint32.wrap(encryptedAsset), inputProof);
}

// ✅ 正确做法：使用 externalEuint32 类型（Zamabelief 的做法）
function registerIdentity(
    externalEuint32 encryptedAsset,  // ✅ 钱包正常识别
    externalEuint32 encryptedNFT,
    externalEuint32 encryptedAge,
    externalEuint32 encryptedTx,
    bytes calldata inputProof
) external {
    // 直接使用，无需 wrap
    euint32 asset = FHE.fromExternal(encryptedAsset, inputProof);
}
```

#### 4. 权限管理：FHE.allow 和 FHE.allowThis

```solidity
// ✅ 正确做法：同时授权用户和合约自身
euint32 asset = FHE.fromExternal(encryptedAsset, inputProof);

// 允许用户访问（用于后续更新操作）
FHE.allow(asset, msg.sender);

// 允许合约自身访问（用于 FHE 计算）
FHE.allowThis(asset);
```

#### 5. 🔥 FHE 权限设置的执行顺序（关键问题！）

**问题症状：**
- 钱包显示"第三方合约执行失败"
- 钱包显示"未知交易类型"
- Gas 估算失败
- 签名失败

**根本原因：** FHE 权限管理函数的调用顺序错误！

**❌ 错误的执行顺序（导致钱包签名失败）：**

```solidity
function registerIdentity(
    externalEuint32 encryptedAsset,
    externalEuint32 encryptedNFT,
    externalEuint32 encryptedAge,
    externalEuint32 encryptedTx,
    bytes calldata inputProof
) external {
    // Step 1: 转换外部加密输入
    euint32 asset = FHE.fromExternal(encryptedAsset, inputProof);
    euint32 nft = FHE.fromExternal(encryptedNFT, inputProof);
    euint32 age = FHE.fromExternal(encryptedAge, inputProof);
    euint32 tx = FHE.fromExternal(encryptedTx, inputProof);

    // ❌ Step 2: 先设置权限（错误！）
    FHE.allow(asset, msg.sender);
    FHE.allow(nft, msg.sender);
    FHE.allow(age, msg.sender);
    FHE.allow(tx, msg.sender);

    FHE.allowThis(asset);
    FHE.allowThis(nft);
    FHE.allowThis(age);
    FHE.allowThis(tx);

    // ❌ Step 3: 后存储数据（这是错误的顺序！）
    identities[msg.sender] = EncryptedIdentity({
        assetBalance: asset,
        nftCount: nft,
        accountAge: age,
        txCount: tx,
        exists: true,
        registeredAt: block.timestamp
    });

    hasRegistered[msg.sender] = true;
}
```

**✅ 正确的执行顺序（参考 Zama 官方实现）：**

```solidity
function registerIdentity(
    externalEuint32 encryptedAsset,
    externalEuint32 encryptedNFT,
    externalEuint32 encryptedAge,
    externalEuint32 encryptedTx,
    bytes calldata inputProof
) external {
    // ✅ Step 1: 转换外部加密输入
    euint32 asset = FHE.fromExternal(encryptedAsset, inputProof);
    euint32 nft = FHE.fromExternal(encryptedNFT, inputProof);
    euint32 age = FHE.fromExternal(encryptedAge, inputProof);
    euint32 tx = FHE.fromExternal(encryptedTx, inputProof);

    // ✅ Step 2: 先存储数据到状态变量（关键！必须先存储！）
    identities[msg.sender] = EncryptedIdentity({
        assetBalance: asset,
        nftCount: nft,
        accountAge: age,
        txCount: tx,
        exists: true,
        registeredAt: block.timestamp
    });

    hasRegistered[msg.sender] = true;

    // ✅ Step 3: 后设置权限（关键！必须在存储之后！）
    // 权限顺序：先 allowThis（合约自己），后 allow（用户）
    FHE.allowThis(asset);
    FHE.allow(asset, msg.sender);

    FHE.allowThis(nft);
    FHE.allow(nft, msg.sender);

    FHE.allowThis(age);
    FHE.allow(age, msg.sender);

    FHE.allowThis(tx);
    FHE.allow(tx, msg.sender);
}
```

**执行顺序规则总结：**

1. **转换** → **存储** → **授权** （必须按照这个顺序！）
2. 权限设置必须在数据存储到状态变量**之后**
3. 每个加密值的权限设置顺序：先 `allowThis`，后 `allow(user)`

**技术原理：**

FHEVM 的权限系统要求：
- 加密值必须先绑定到具体的存储位置（storage slot）
- 只有存储后，FHEVM 才能正确追踪加密值的访问权限
- 如果在存储前设置权限，权限信息会丢失或绑定失败

**参考实现：**
- Zama 官方示例：`fhevm-contracts/EncryptedERC20.sol`
- Zama 官方示例：`fhevm-contracts/ConfidentialGovernorAlpha.sol`
- Zamabelief 项目：`contracts/BeliefMarket.sol`

**关键原因：**

1. **类型识别**：`externalEuint32` 是 FHEVM 定义的特殊类型，钱包可以正确识别和序列化
2. **ABI 兼容性**：使用正确的类型后，ABI 中的函数签名才能被钱包正确解析
3. **Gas 估算**：正确的类型可以让钱包准确估算 FHE 操作所需的 gas
4. **配置继承**：`SepoliaConfig` 包含了网络特定的配置（Gateway地址、Oracle地址等）

**技术对比：**

| 方案 | 钱包识别 | Gas估算 | 开发复杂度 |
|------|---------|--------|-----------|
| bytes32 + wrap | ❌ 失败 | ❌ 失败 | 🔴 高（需要 wrap） |
| externalEuint* | ✅ 成功 | ✅ 成功 | 🟢 低（直接使用） |

**参考实现：**
- Zamabelief 项目：`contracts/BeliefMarket.sol`
- 使用 `externalEuint64` 类型的 vote 函数
- 官方文档：https://docs.zama.ai/fhevm

### 2.2 核心合约详解

#### 2.2.1 IdentityProofManager.sol

**职责**: 管理用户的加密身份证明

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract IdentityProofManager is GatewayCaller {
    // 用户身份数据（加密存储）
    struct EncryptedIdentity {
        euint32 assetBalance;      // 加密资产余额
        euint32 nftCount;          // 加密 NFT 数量
        euint32 accountAge;        // 加密账户年龄（天）
        euint32 txCount;           // 加密交易次数
        bool exists;               // 是否已注册
    }

    mapping(address => EncryptedIdentity) private identities;
    mapping(address => bool) public hasRegistered;

    event IdentityRegistered(address indexed user);
    event ProofSubmitted(address indexed user, string proofType);

    // 用户注册身份（提交加密数据）
    function registerIdentity(
        bytes calldata encryptedAsset,
        bytes calldata encryptedNFT,
        bytes calldata encryptedAge,
        bytes calldata encryptedTx,
        bytes calldata inputProof
    ) external {
        require(!hasRegistered[msg.sender], "Already registered");

        // 解析加密输入
        euint32 asset = TFHE.asEuint32(encryptedAsset);
        euint32 nft = TFHE.asEuint32(encryptedNFT);
        euint32 age = TFHE.asEuint32(encryptedAge);
        euint32 tx = TFHE.asEuint32(encryptedTx);

        // 验证 inputProof
        require(TFHE.isAllowed(asset, msg.sender), "Invalid asset proof");

        // 存储加密数据
        identities[msg.sender] = EncryptedIdentity({
            assetBalance: asset,
            nftCount: nft,
            accountAge: age,
            txCount: tx,
            exists: true
        });

        hasRegistered[msg.sender] = true;
        emit IdentityRegistered(msg.sender);
    }

    // 更新资产数据
    function updateAssetBalance(
        bytes calldata encryptedBalance,
        bytes calldata inputProof
    ) external {
        require(hasRegistered[msg.sender], "Not registered");

        euint32 newBalance = TFHE.asEuint32(encryptedBalance);
        require(TFHE.isAllowed(newBalance, msg.sender), "Invalid proof");

        identities[msg.sender].assetBalance = newBalance;
        emit ProofSubmitted(msg.sender, "asset");
    }

    // 内部：获取用户加密数据
    function _getEncryptedData(address user) internal view returns (EncryptedIdentity memory) {
        require(identities[user].exists, "User not registered");
        return identities[user];
    }
}
```

#### 2.2.2 ReputationScore.sol

**职责**: 管理用户声誉分数（明文存储）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReputationScore {
    struct Reputation {
        uint256 score;              // 当前分数
        uint256 lastActivityTime;   // 最后活跃时间
        uint256 totalVerifications; // 完成的验证次数
        uint256 totalContributions; // 贡献次数
    }

    mapping(address => Reputation) public reputations;

    // 声誉等级枚举
    enum ReputationLevel { Novice, Active, Trusted, Veteran, Legend }

    // 加分事件
    uint256 public constant REWARD_IDENTITY_VERIFIED = 10;
    uint256 public constant REWARD_DAO_VOTE = 5;
    uint256 public constant REWARD_TX_SUCCESS = 2;
    uint256 public constant REWARD_WEEKLY_ACTIVE = 3;
    uint256 public constant REWARD_OPENSOURCE = 15;

    // 减分事件
    uint256 public constant PENALTY_MALICIOUS_TX = 20;
    uint256 public constant PENALTY_REPORTED = 10;
    uint256 public constant PENALTY_INACTIVE_MONTHLY = 1;

    event ScoreChanged(address indexed user, int256 change, uint256 newScore);
    event LevelUp(address indexed user, ReputationLevel newLevel);

    // 添加分数
    function addScore(address user, uint256 amount) external {
        reputations[user].score += amount;
        reputations[user].lastActivityTime = block.timestamp;
        emit ScoreChanged(user, int256(amount), reputations[user].score);

        // 检查是否升级
        ReputationLevel newLevel = getLevel(user);
        emit LevelUp(user, newLevel);
    }

    // 减少分数
    function deductScore(address user, uint256 amount) external {
        uint256 currentScore = reputations[user].score;
        if (currentScore >= amount) {
            reputations[user].score -= amount;
        } else {
            reputations[user].score = 0;
        }
        emit ScoreChanged(user, -int256(amount), reputations[user].score);
    }

    // 获取用户等级
    function getLevel(address user) public view returns (ReputationLevel) {
        uint256 score = reputations[user].score;
        if (score >= 5001) return ReputationLevel.Legend;
        if (score >= 1001) return ReputationLevel.Veteran;
        if (score >= 501) return ReputationLevel.Trusted;
        if (score >= 101) return ReputationLevel.Active;
        return ReputationLevel.Novice;
    }

    // 检查是否满足分数要求
    function meetsScoreRequirement(address user, uint256 minScore) external view returns (bool) {
        return reputations[user].score >= minScore;
    }
}
```

#### 2.2.3 VerificationService.sol

**职责**: 处理 dApp 的验证请求（FHE 比较）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "./IdentityProofManager.sol";
import "./ReputationScore.sol";

contract VerificationService is GatewayCaller {
    IdentityProofManager public identityManager;
    ReputationScore public reputationScore;

    struct VerificationRequest {
        address requester;      // 请求方（dApp）
        address user;           // 被验证用户
        uint32 assetThreshold;  // 资产门槛（明文）
        uint32 accountAgeMin;   // 最小账户年龄（天）
        uint256 reputationMin;  // 最小声誉分数
        bool isPending;         // 是否等待 Oracle 回调
        bool result;            // 验证结果
    }

    mapping(uint256 => VerificationRequest) public requests;
    uint256 public nextRequestId;

    event VerificationRequested(uint256 indexed requestId, address indexed user);
    event VerificationCompleted(uint256 indexed requestId, bool result);

    constructor(address _identityManager, address _reputationScore) {
        identityManager = IdentityProofManager(_identityManager);
        reputationScore = ReputationScore(_reputationScore);
    }

    // dApp 请求验证
    function requestVerification(
        address user,
        uint32 assetThreshold,
        uint32 accountAgeMin,
        uint256 reputationMin
    ) external returns (uint256) {
        uint256 requestId = nextRequestId++;

        requests[requestId] = VerificationRequest({
            requester: msg.sender,
            user: user,
            assetThreshold: assetThreshold,
            accountAgeMin: accountAgeMin,
            reputationMin: reputationMin,
            isPending: true,
            result: false
        });

        // 启动 FHE 验证流程
        _performVerification(requestId);

        emit VerificationRequested(requestId, user);
        return requestId;
    }

    // 执行 FHE 验证（内部）
    function _performVerification(uint256 requestId) internal {
        VerificationRequest storage req = requests[requestId];

        // 1️⃣ 获取用户加密数据
        IdentityProofManager.EncryptedIdentity memory identity =
            identityManager._getEncryptedData(req.user);

        // 2️⃣ FHE 比较：资产 >= 门槛
        ebool assetMeetsThreshold = TFHE.gte(
            identity.assetBalance,
            TFHE.asEuint32(req.assetThreshold)
        );

        // 3️⃣ FHE 比较：账户年龄 >= 最小值
        ebool ageMeetsThreshold = TFHE.gte(
            identity.accountAge,
            TFHE.asEuint32(req.accountAgeMin)
        );

        // 4️⃣ 组合条件（AND）
        ebool meetsAllCriteria = TFHE.and(assetMeetsThreshold, ageMeetsThreshold);

        // 5️⃣ 请求 Oracle 解密结果
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(meetsAllCriteria);

        Gateway.requestDecryption(
            cts,
            this.handleOracleCallback.selector,
            0, // maxTimestamp (不限制)
            false, // blockOnError
            false // allowMocked
        );
    }

    // Oracle 回调（异步）
    function handleOracleCallback(
        uint256 /*requestId*/,
        bool decryptedResult
    ) public onlyGateway {
        // 解密后的布尔结果
        uint256 reqId = nextRequestId - 1; // 简化处理（实际需要映射）
        VerificationRequest storage req = requests[reqId];

        // 6️⃣ 检查声誉分数（明文比较）
        bool meetsReputation = reputationScore.meetsScoreRequirement(
            req.user,
            req.reputationMin
        );

        // 7️⃣ 最终结果 = FHE 验证 AND 声誉验证
        bool finalResult = decryptedResult && meetsReputation;

        req.result = finalResult;
        req.isPending = false;

        emit VerificationCompleted(reqId, finalResult);

        // 8️⃣ 如果通过，增加声誉分数
        if (finalResult) {
            reputationScore.addScore(req.user, reputationScore.REWARD_IDENTITY_VERIFIED());
        }
    }

    // 查询验证结果
    function getVerificationResult(uint256 requestId) external view returns (bool) {
        require(!requests[requestId].isPending, "Still pending");
        return requests[requestId].result;
    }
}
```

#### 2.2.4 CredentialNFT.sol

**职责**: 颁发不可转让的身份证书（SBT）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CredentialNFT is ERC721 {
    enum CredentialType { KYC, HighNetWorth, ActiveUser, Developer }

    struct Credential {
        CredentialType credType;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
    }

    mapping(uint256 => Credential) public credentials;
    uint256 public nextTokenId;

    address public issuer; // VerificationService 合约

    event CredentialIssued(address indexed to, uint256 tokenId, CredentialType credType);
    event CredentialRevoked(uint256 tokenId);

    constructor() ERC721("PrivyRep Credential", "PRIVY-CRED") {
        issuer = msg.sender;
    }

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not authorized");
        _;
    }

    // 颁发证书
    function issueCredential(
        address to,
        CredentialType credType,
        uint256 validityDays
    ) external onlyIssuer returns (uint256) {
        uint256 tokenId = nextTokenId++;

        credentials[tokenId] = Credential({
            credType: credType,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (validityDays * 1 days),
            isRevoked: false
        });

        _mint(to, tokenId);
        emit CredentialIssued(to, tokenId, credType);
        return tokenId;
    }

    // 撤销证书
    function revokeCredential(uint256 tokenId) external onlyIssuer {
        require(_exists(tokenId), "Token doesn't exist");
        credentials[tokenId].isRevoked = true;
        emit CredentialRevoked(tokenId);
    }

    // 检查证书是否有效
    function isCredentialValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;

        Credential memory cred = credentials[tokenId];
        if (cred.isRevoked) return false;
        if (block.timestamp > cred.expiresAt) return false;

        return true;
    }

    // 🚫 禁止转移（SBT）
    function _transfer(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/
    ) internal pure override {
        revert("Soulbound: Transfer not allowed");
    }
}
```

---

## 3. FHE 实现细节

### 3.0 SDK 初始化 - CDN 加载方案（关键技术点）⭐

**问题背景：**
使用 npm 包 `@zama-fhe/relayer-sdk` 会导致 Vite bundler 无法正确处理 WASM 文件，出现以下错误：
```
WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f
```

**根本原因：**
- WASM 文件在打包过程中路径解析失败
- Vite 7.x 与 WASM bundling 存在兼容性问题
- 服务器返回 HTML 错误页（`<!do...`）而不是 WASM 二进制文件

**✅ 解决方案：使用 CDN 动态加载（Zamabelief 验证方案）**

```typescript
// services/fheService.ts

/**
 * 从 Zama CDN 动态加载 SDK，避免本地打包问题
 * 参考：Zamabelief 项目的成功实践
 */
export async function initializeFheInstance(): Promise<FhevmInstance> {
  console.log('🔧 [FHE] Initializing FHE instance...');

  try {
    // ⭐ 关键点 1：从 CDN 动态导入，而不是 npm 包
    // ❌ 错误做法：const sdk = await import('@zama-fhe/relayer-sdk/web');
    // ✅ 正确做法：从 CDN 加载
    const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');

    const { initSDK, createInstance, SepoliaConfig } = sdk;

    // ⭐ 关键点 2：调用 initSDK() 加载 WASM 模块
    await initSDK();

    // ⭐ 关键点 3：使用 SepoliaConfig 和 window.ethereum
    const config = { ...SepoliaConfig, network: window.ethereum };
    const instance = await createInstance(config);

    return instance;
  } catch (error: any) {
    console.error('❌ [FHE] FHEVM instance creation failed:', error);
    throw error;
  }
}
```

**技术要点：**

1. **为什么 CDN 方式有效？**
   - 绕过 Vite bundler，避免 WASM 路径解析问题
   - 使用浏览器原生的 HTTP imports 功能
   - WASM 文件由 CDN 直接提供，无需本地打包
   - 锁定经过测试的 0.2.0 版本

2. **Vite 配置简化：**
   ```typescript
   // vite.config.ts - 不需要 vite-plugin-wasm！
   export default defineConfig({
     plugins: [
       react(),
       nodePolyfills()  // 只需要 Node.js polyfills
     ],
     optimizeDeps: {
       include: ['buffer', 'process', 'util', 'crypto']
     },
     define: {
       global: 'globalThis'
     }
   })
   ```

3. **不需要的插件：**
   - ❌ `vite-plugin-wasm` - 不需要
   - ❌ `vite-plugin-top-level-await` - 不需要
   - ❌ 复杂的 WASM asset 配置 - 不需要

4. **性能对比：**
   | 方案 | 加载时间 | 可靠性 | 维护成本 |
   |------|---------|--------|---------|
   | NPM 包 | ❌ 失败 | ❌ 低 | 🔴 高 |
   | CDN 方式 | ✅ ~2-3秒 | ✅ 高 | 🟢 低 |

**参考实现：**
- Zamabelief 项目：`src/utils/fheInstance.ts`
- 官方文档：https://docs.zama.ai/fhevm

### 3.0.1 React 副作用管理关键点 ⭐

**问题背景：**
在使用 `wagmi` 和 `react-hot-toast` 时，如果在组件渲染期间直接调用 toast，会导致React错误："Cannot update a component while rendering a different component"。

**❌ 错误做法：在渲染期间调用副作用**

```typescript
export function VerificationRequest() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // ❌ 错误：在渲染期间直接调用 toast
  if (isSuccess) {
    toast.success('验证请求已提交！', { id: hash });
  }

  if (error) {
    toast.error(`交易失败: ${error.message}`, { id: 'tx-error' });
  }

  return <div>...</div>;
}
```

**✅ 正确做法：使用 useEffect 处理副作用**

```typescript
import { useState, useEffect } from 'react';

export function VerificationRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // ✅ 正确：在 useEffect 中处理副作用
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('验证请求已提交！', { id: hash });
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (error) {
      toast.error(`交易失败: ${error.message}`, { id: 'tx-error' });
    }
  }, [error]);

  return <div>...</div>;
}
```

**关键原因：**

1. **React 渲染原则**：组件的渲染函数应该是纯函数，不应包含副作用
2. **状态更新隔离**：toast 会触发其他组件的状态更新，必须在副作用阶段执行
3. **依赖跟踪**：useEffect 的依赖数组确保副作用只在必要时执行

**适用场景：**

- ✅ Toast 通知
- ✅ 事件追踪（Analytics）
- ✅ 本地存储操作
- ✅ 订阅/取消订阅
- ✅ 手动 DOM 操作

**错误症状：**

```
Cannot update a component (`Fe`) while rendering a different component (`VerificationRequest`).
To locate the bad setState() call inside `VerificationRequest`, follow the stack trace...
```

**参考实现：**
- PrivyRep 项目：`src/components/IdentityRegistration.tsx`
- PrivyRep 项目：`src/components/VerificationRequest.tsx`
- React 官方文档：https://react.dev/reference/react/useEffect

### 3.1 加密流程

```typescript
// services/fheService.ts

export async function encryptUserData(
  assetBalance: number,
  nftCount: number,
  accountAge: number,
  txCount: number,
  userAddress: string
): Promise<EncryptedInputs> {
  const instance = await getFhevmInstance();

  // 1️⃣ 创建加密输入对象
  const input = instance.createEncryptedInput(
    CONTRACT_ADDRESS,
    userAddress
  );

  // 2️⃣ 添加 4 个 uint32 值
  input.add32(assetBalance);
  input.add32(nftCount);
  input.add32(accountAge);
  input.add32(txCount);

  // 3️⃣ 执行加密
  const encryptedData = await input.encrypt();

  // 🔥 关键修复：使用 ethers.utils.hexlify 转换（参考 Zamabelief）
  // ❌ 错误：使用自定义 uint8ArrayToHex 会导致格式问题
  // ✅ 正确：使用 ethers v5 的 utils.hexlify
  const handles = encryptedData.handles.map((h: any) => utils.hexlify(h) as `0x${string}`);
  const inputProof = utils.hexlify(encryptedData.inputProof) as `0x${string}`;

  return {
    encryptedAsset: handles[0],
    encryptedNFT: handles[1],
    encryptedAge: handles[2],
    encryptedTx: handles[3],
    inputProof: inputProof,
  };
}
```

#### 🔥 关键问题：hexlify 函数的正确导入（ethers v5 兼容性）

**问题症状：**
- 页面空白
- 控制台错误：`The requested module does not provide an export named 'hexlify'`
- Vite 编译失败

**根本原因：** 在 ethers v5 中，`hexlify` 不是顶级导出，而是在 `utils` 模块下。

**❌ 错误的导入方式（不兼容 ethers v5）：**

```typescript
// services/fheService.ts

import { hexlify } from 'ethers';  // ❌ 在 ethers v5 中会失败！

export async function encryptIdentityData(...) {
  // ...
  const handles = encryptedInput.handles.map((h: any) => hexlify(h));  // ❌ 错误
  const inputProof = hexlify(encryptedInput.inputProof);  // ❌ 错误
  // ...
}
```

**✅ 正确的导入方式（兼容 ethers v5）：**

```typescript
// services/fheService.ts

import { utils } from 'ethers';  // ✅ 正确！从 utils 导入

export async function encryptIdentityData(...) {
  const encryptedInput = await input.encrypt();

  // ✅ 使用 utils.hexlify 转换加密数据
  const handles = encryptedInput.handles.map((h: any) =>
    utils.hexlify(h) as `0x${string}`
  );
  const inputProof = utils.hexlify(encryptedInput.inputProof) as `0x${string}`;

  return {
    encryptedAsset: handles[0],
    encryptedNFT: handles[1],
    encryptedAge: handles[2],
    encryptedTx: handles[3],
    inputProof: inputProof,
  };
}
```

**技术原理：**

在 ethers.js 的不同版本中，`hexlify` 的导出位置不同：

| ethers 版本 | hexlify 导入方式 | 使用方式 |
|------------|----------------|---------|
| ethers v5.x | `import { utils } from 'ethers'` | `utils.hexlify(data)` |
| ethers v6.x | `import { hexlify } from 'ethers'` | `hexlify(data)` |

**Zamabelief 参考：**
- Zamabelief 项目使用 `ethers@5.8.0`
- 他们的实现也使用 `utils.hexlify` 进行转换
- 文件位置：`zamabelief/src/hooks/useCastVote.ts`

**为什么必须使用 hexlify：**

1. **格式标准化**：`hexlify` 确保输出的十六进制字符串符合以太坊标准格式
2. **类型兼容**：`hexlify` 的输出类型与合约 ABI 期望的 `bytes` 类型完全匹配
3. **Uint8Array 处理**：FHEVM SDK 返回的 handles 和 inputProof 是 Uint8Array 类型，必须转换为十六进制字符串才能传递给合约

**❌ 自定义转换函数的问题：**

```typescript
// ❌ 不推荐：自定义转换函数可能导致格式不兼容
function uint8ArrayToHex(uint8Array: Uint8Array): `0x${string}` {
  return `0x${Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}
```

虽然这个自定义函数在大多数情况下可以工作，但：
- 缺少 ethers.js 的额外验证和规范化
- 可能在边界情况下产生不一致的结果
- 不遵循 Zama 官方示例的最佳实践

**最佳实践总结：**

1. **检查 ethers 版本**：确认项目使用的是 ethers v5 还是 v6
2. **使用正确导入**：ethers v5 使用 `utils.hexlify`，v6 使用顶级 `hexlify`
3. **参考官方示例**：优先使用 Zama 和 ethers.js 官方推荐的转换方法
4. **避免自定义**：除非有特殊需求，否则不要自己实现 hex 转换函数



### 3.2 解密流程（Oracle Callback）

```
用户提交加密数据
        ↓
合约执行 FHE 比较（euint32 >= threshold）
        ↓
Gateway.requestDecryption(ebool)
        ↓
[等待 Zama Oracle 处理...]
        ↓
Oracle 调用 handleOracleCallback(bool decryptedResult)
        ↓
合约根据解密结果执行逻辑（发放 NFT、增加声誉等）
```

### 3.3 支持的 FHE 操作

| 操作类型 | Solidity 函数 | 用途示例 |
|---------|--------------|----------|
| 比较 | `TFHE.gte(euint32, euint32)` | 验证资产 >= 门槛 |
| 逻辑与 | `TFHE.and(ebool, ebool)` | 组合多个条件 |
| 逻辑或 | `TFHE.or(ebool, ebool)` | 满足任一条件 |
| 解密请求 | `Gateway.requestDecryption()` | 获取最终 Pass/Fail |

---

## 4. 前端架构

### 4.1 目录结构

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── ReputationCard.tsx      # 声誉分数展示
│   │   ├── CredentialList.tsx      # 证书列表
│   │   └── ActivityTimeline.tsx    # 活动时间线
│   ├── Verification/
│   │   ├── ProofSubmitForm.tsx     # 提交证明表单
│   │   ├── VerificationStatus.tsx  # 验证状态展示
│   │   └── PrivacyNotice.tsx       # 隐私说明
│   └── Credentials/
│       ├── CredentialCard.tsx      # 单个证书卡片
│       └── CredentialDetail.tsx    # 证书详情
├── services/
│   ├── fheService.ts              # FHE 加密服务
│   ├── contractService.ts         # 合约调用封装
│   └── dataCollector.ts           # 用户数据采集
├── hooks/
│   ├── useFheInstance.ts          # FHE 实例管理
│   ├── useReputation.ts           # 声誉数据钩子
│   └── useVerification.ts         # 验证流程钩子
├── store/
│   └── userStore.ts               # Zustand 状态管理
├── utils/
│   ├── fhevm.ts                   # FHEVM 工具函数
│   └── constants.ts               # 常量定义
└── pages/
    ├── Home.tsx
    ├── Dashboard.tsx
    ├── Verify.tsx
    └── Credentials.tsx
```

### 4.2 关键组件设计

#### ProofSubmitForm.tsx

```tsx
export function ProofSubmitForm() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { encryptAndSubmit, isPending } = useVerification();

  const handleSubmit = async () => {
    // 1️⃣ 收集用户数据
    const userData = {
      assetBalance: parseFloat(formatEther(balance?.value || 0n)) * 1000, // 转为 milli-ETH
      nftCount: await fetchNFTCount(address),
      accountAge: await calculateAccountAge(address),
      txCount: await fetchTransactionCount(address),
    };

    // 2️⃣ 加密并提交
    await encryptAndSubmit(userData);
  };

  return (
    <div className="space-y-6">
      <WalletBalanceDisplay balance={balance} />
      <PrivacyNotice />
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Encrypting..." : "Submit Proof"}
      </button>
    </div>
  );
}
```

#### useVerification.ts Hook

```typescript
export function useVerification() {
  const { writeContract } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const encryptAndSubmit = async (userData: UserData) => {
    setIsPending(true);
    try {
      // 1️⃣ 加密数据
      const encrypted = await encryptUserData(
        userData.assetBalance,
        userData.nftCount,
        userData.accountAge,
        userData.txCount,
        address!
      );

      // 2️⃣ 调用合约
      writeContract({
        address: IDENTITY_MANAGER_ADDRESS,
        abi: IdentityManagerABI,
        functionName: "registerIdentity",
        args: [
          encrypted.encryptedAsset,
          encrypted.encryptedNFT,
          encrypted.encryptedAge,
          encrypted.encryptedTx,
          encrypted.inputProof,
        ],
      });
    } catch (error) {
      console.error("Verification failed:", error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { encryptAndSubmit, isPending };
}
```

---

## 5. dApp 集成 SDK

### 5.1 SDK 设计

```typescript
// @privyrep/sdk

export class PrivyRepSDK {
  private verificationService: ethers.Contract;

  constructor(provider: ethers.Provider, contractAddress: string) {
    this.verificationService = new ethers.Contract(
      contractAddress,
      VerificationServiceABI,
      provider
    );
  }

  // 请求验证
  async requestVerification(params: {
    userAddress: string;
    assetThreshold: number;
    accountAgeMin?: number;
    reputationMin?: number;
  }): Promise<string> {
    const tx = await this.verificationService.requestVerification(
      params.userAddress,
      params.assetThreshold,
      params.accountAgeMin || 0,
      params.reputationMin || 0
    );

    const receipt = await tx.wait();
    const requestId = receipt.events[0].args.requestId;
    return requestId;
  }

  // 查询验证结果
  async getVerificationResult(requestId: string): Promise<boolean> {
    return await this.verificationService.getVerificationResult(requestId);
  }

  // 监听验证完成事件
  onVerificationCompleted(
    callback: (requestId: string, result: boolean) => void
  ) {
    this.verificationService.on("VerificationCompleted", callback);
  }
}
```

### 5.2 使用示例

```typescript
// dApp 集成示例

import { PrivyRepSDK } from "@privyrep/sdk";

const sdk = new PrivyRepSDK(provider, VERIFICATION_SERVICE_ADDRESS);

// 场景：空投白名单验证
async function checkAirdropEligibility(userAddress: string) {
  const requestId = await sdk.requestVerification({
    userAddress,
    assetThreshold: 5000, // 5 ETH (milli-ETH)
    accountAgeMin: 365,   // 1 year
    reputationMin: 100,   // Active user level
  });

  // 监听结果
  sdk.onVerificationCompleted((id, result) => {
    if (id === requestId && result) {
      console.log("User eligible for airdrop!");
      // 添加到白名单...
    }
  });
}
```

---

## 6. 数据流设计

### 6.1 用户注册流程

```
User → Frontend → FHE Service → Blockchain
 │                    │              │
 │      采集数据        │     加密      │
 │   (余额/NFT/...)    │              │
 │                    │              │
 │◄───────────────────┘              │
 │    返回加密数据                     │
 │                                   │
 │──────────────────────────────────►│
       提交 registerIdentity()        │
                                     │
                              存储加密数据
```

### 6.2 验证请求流程

```
dApp → VerificationService → IdentityManager → Gateway
 │            │                      │             │
 │  请求验证   │                      │             │
 │           │  获取加密数据          │             │
 │           │◄─────────────────────┘             │
 │           │                                    │
 │           │  FHE 比较 (gte/and)                │
 │           │───────────────────────────────────►│
 │           │                                    │
 │           │            ┌─── Oracle ────┐       │
 │           │            │   解密 ebool   │       │
 │           │◄───────────┴────────────────┘       │
 │           │                                    │
 │◄──────────┘  返回 Pass/Fail                   │
    发送 Webhook/Event
```

---

## 7. 安全性设计

### 7.1 攻击面分析

| 攻击类型 | 风险描述 | 缓解措施 |
|---------|---------|---------|
| **女巫攻击** | 一人创建多账户刷声誉 | 1️⃣ 要求初始身份验证（资产/NFT）<br>2️⃣ 声誉累积需要时间成本<br>3️⃣ 集成外部 KYC（未来） |
| **重放攻击** | 复用旧的加密证明 | inputProof 包含 nonce 和时间戳 |
| **前端篡改** | 修改前端代码提交假数据 | 合约验证 inputProof 密码学签名 |
| **Oracle 操纵** | 攻击者试图影响解密结果 | 使用 Zama 官方 Oracle（可信） |
| **合约漏洞** | Reentrancy、Overflow 等 | 1️⃣ 使用 OpenZeppelin 库<br>2️⃣ 代码审计<br>3️⃣ Bug Bounty |

### 7.2 隐私保护措施

1. **链上数据加密**: 所有敏感数据（资产、NFT 数量等）以 euint32 形式存储，无法逆向
2. **零知识证明**: 验证结果只返回布尔值（Pass/Fail），不泄露具体数值
3. **权限控制**: 只有数据所有者可以更新自己的加密数据
4. **解密限制**: Oracle 回调只返回必要的布尔结果，不解密原始数据

### 7.3 审计清单

- [ ] Slither 静态分析
- [ ] Mythril 符号执行
- [ ] 手动代码审计（外部团队）
- [ ] Gas 优化审查
- [ ] FHE 操作正确性验证
- [ ] Oracle 回调安全性测试

---

## 8. 性能优化

### 8.1 Gas 优化策略

1. **批量操作**: 允许用户一次更新多个属性
2. **事件压缩**: 减少 event 参数数量
3. **存储优化**: 使用 `uint32` 而非 `uint256`
4. **冷热数据分离**: 常用数据存主合约，历史记录存子合约

### 8.2 FHE 性能优化

1. **减少 FHE 操作次数**:
   - 先验证明文条件（声誉分数）
   - 再执行 FHE 比较（减少 Gas）

2. **批量解密**:
   - 一次 `requestDecryption` 解密多个 ebool
   - 减少 Oracle 回调次数

### 8.3 前端优化

1. **WASM 缓存**:
   ```typescript
   // 缓存 WASM 模块到 localStorage
   const cachedWasm = localStorage.getItem("fhe-wasm");
   if (cachedWasm) {
     await initSDK({ wasmModule: cachedWasm });
   }
   ```

2. **并行加密**:
   ```typescript
   // 同时加密多个值
   await Promise.all([
     encryptAsset(balance),
     encryptNFTCount(nftCount),
     encryptAccountAge(age),
   ]);
   ```

---

## 9. 部署方案

### 9.1 Testnet 部署步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env:
# PRIVATE_KEY=your_private_key
# SEPOLIA_RPC_URL=https://api.zan.top/eth-sepolia

# 3. 编译合约
npx hardhat compile

# 4. 部署脚本
npx hardhat run scripts/deploy.ts --network sepolia

# 5. 验证合约
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 9.2 合约部署顺序

```
1. ReputationScore.sol
   ↓
2. IdentityProofManager.sol
   ↓
3. VerificationService.sol (传入上面两个地址)
   ↓
4. CredentialNFT.sol
   ↓
5. 设置权限: setIssuer(VerificationService 地址)
```

### 9.3 前端部署

```bash
# 1. 配置合约地址
# contracts/deployedContracts.ts
export const deployedContracts = {
  11155111: { // Sepolia
    IdentityProofManager: { address: "0x...", abi: [...] },
    ReputationScore: { address: "0x...", abi: [...] },
    VerificationService: { address: "0x...", abi: [...] },
    CredentialNFT: { address: "0x...", abi: [...] },
  }
};

# 2. 构建前端
pnpm build

# 3. 部署到 Vercel
vercel --prod
```

---

## 10. 监控与运维

### 10.1 关键指标监控

1. **合约事件监控**:
   - `IdentityRegistered`: 新用户注册数
   - `VerificationCompleted`: 验证完成率
   - `ScoreChanged`: 声誉变动趋势

2. **Oracle 健康检查**:
   - 回调延迟时间
   - 失败率统计

3. **前端性能**:
   - 加密耗时（目标 < 5 秒）
   - 页面加载时间

### 10.2 错误处理

```typescript
// 前端统一错误处理
try {
  await encryptAndSubmit(userData);
} catch (error) {
  if (error.code === "ACTION_REJECTED") {
    toast.error("User cancelled transaction");
  } else if (error.message.includes("Gateway")) {
    toast.error("FHE Gateway connection failed");
    // 重试逻辑...
  } else {
    Sentry.captureException(error);
    toast.error("Unknown error occurred");
  }
}
```

---

## 11. 技术风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|-----|------|------|---------|
| FHE 计算时间过长 | 中 | 高 | 1️⃣ 优化算法<br>2️⃣ 展示进度条<br>3️⃣ 后台处理 |
| Oracle 回调失败 | 低 | 高 | 1️⃣ 实现重试机制<br>2️⃣ 超时提醒<br>3️⃣ 备用方案 |
| 智能合约升级需求 | 高 | 中 | 1️⃣ 使用代理模式（UUPS）<br>2️⃣ 预留升级接口 |
| WASM 模块加载失败 | 低 | 中 | 1️⃣ CDN 备份<br>2️⃣ 降级提示 |

---

**文档版本**: v1.0
**最后更新**: 2025-10-26
**作者**: PrivyRep Team
**审核状态**: 待审核
