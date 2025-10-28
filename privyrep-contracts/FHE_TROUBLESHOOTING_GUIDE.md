# FHE 合约调用问题 - 故障排查指南 🔧

## 问题现象
- 注册身份或请求验证时，MetaMask 弹出签名窗口，显示"第三方合约执行失败"
- 交易无法提交

## 诊断结果 ✅

运行 `pnpm hardhat run scripts/diagnose.js --network sepolia` 显示：

1. ✅ 合约部署正常
2. ✅ VerificationServiceV2 已被授权
3. ✅ 部署者已注册身份（说明合约功能正常）

**结论：合约本身没有问题，问题出在前端 FHE SDK 或网络连接！**

---

## 可能原因分析

### 🔴 原因 1: FHE SDK 版本不匹配（最可能）

**问题：**
- 前端 `fheService.ts` 使用 CDN 加载的 SDK 版本是 **0.2.0**
- 合约编译使用的 `@zama-fhe/oracle-solidity` 版本是 **0.1.0**
- 版本不匹配可能导致加密数据格式不兼容

**位置：**
`privyrep-frontend/src/services/fheService.ts:44`
```typescript
// ❌ 当前使用 0.2.0
const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
```

**修复方案：** 降级前端 SDK 到 0.1.0

---

### 🔴 原因 2: 无法连接 Zama Gateway

**问题：**
- FHE 加密需要连接 Zama 的 Gateway 服务
- 网络问题或 Gateway 不可用会导致加密失败

**检查方法：**
1. 打开浏览器控制台（F12）
2. 查看 Network 标签，是否有请求到 `gateway.zama.ai` 失败
3. 查看 Console 标签，是否有 FHE 初始化错误

---

### 🔴 原因 3: MetaMask 网络配置不正确

**问题：**
- MetaMask 连接的不是 Sepolia 测试网
- RPC URL 配置错误

**检查方法：**
1. 打开 MetaMask
2. 确认网络显示为 "Sepolia"
3. Chain ID 应该是 11155111

---

### 🔴 原因 4: Gas 估算失败

**问题：**
- FHE 操作需要大量 gas
- 虽然前端设置了 3000000，但可能还不够

**当前设置：**
`IdentityRegistration.tsx:67`
```typescript
gas: 3000000n, // ⭐ FHE 合约需要大量 gas
```

---

## 🔧 修复方案

### 方案 1：降级前端 FHE SDK 到 0.1.0（推荐）

**步骤：**

1. 编辑 `privyrep-frontend/src/services/fheService.ts`，找到第44行：

```typescript
// ❌ 旧版本 (0.2.0)
const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');

// ✅ 改为 0.1.0
const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.1.0/relayer-sdk-js.js');
```

2. 清除浏览器缓存：
   - Chrome: Ctrl+Shift+Delete → 清除缓存图像和文件
   - 或使用隐身窗口测试

3. 重启前端开发服务器：
```bash
cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-frontend
pkill -9 -f "vite"
pnpm run dev
```

4. 重新测试注册身份

---

### 方案 2：检查浏览器控制台错误

**步骤：**

1. 打开前端页面：`http://localhost:3000/`
2. 按 F12 打开浏览器开发者工具
3. 切换到 **Console** 标签
4. 点击"注册身份"或"请求验证"按钮
5. 查看控制台输出：

**期望看到（正常情况）：**
```
🔧 [FHE] Initializing FHE instance...
✅ [FHE] Environment checks passed
📦 [FHE] Loading SDK from Zama CDN...
✅ [FHE] SDK loaded from CDN
📦 [FHE] Loading WASM modules...
✅ [FHE] WASM modules loaded
⚙️ [FHE] Creating FHEVM instance with SepoliaConfig...
✅ [FHE] FHEVM instance created successfully!
🔐 [FHE] Starting identity encryption process...
✅ [FHE] Encryption complete!
```

**如果看到错误：**
- `Failed to fetch` → 网络问题，无法连接 CDN
- `WASM module loading failed` → WASM 加载失败，刷新页面
- `Gateway connection failed` → 无法连接 Zama Gateway
- `createEncryptedInput is not a function` → SDK API 不兼容，需要降级

**请复制完整的错误信息并提供给我！**

---

### 方案 3：增加 Gas 限制

如果 SDK 版本正确，但仍然失败，尝试增加 Gas：

编辑 `privyrep-frontend/src/components/IdentityRegistration.tsx:67`：

```typescript
gas: 5000000n, // ⭐ 增加到 5M gas
```

---

### 方案 4：回滚到 V1（临时方案）

如果上述方案都不行，可以暂时切回 V1（不使用 FHE Oracle）：

```bash
cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-frontend

# 编辑 .env
nano .env

# 注释 V2 地址：
# VITE_VERIFICATION_SERVICE_ADDRESS=0x92846236576E783D6404232934AFc1C5914eEFb7

# 取消注释 V1 地址：
VITE_VERIFICATION_SERVICE_ADDRESS=0xe43D69d358a79E92c9dE402303aE957102090a75

# 重启前端
pnpm run dev
```

V1 使用手动验证，不依赖 Oracle，更稳定。

---

## 📊 故障诊断流程图

```
用户点击"注册身份" → 前端加载 FHE SDK (CDN)
                          ↓
                    SDK 加载成功？
                    ↙         ↘
              YES               NO → ❌ 检查网络/CDN可访问性
               ↓
    连接 Zama Gateway？
        ↙         ↘
   YES           NO → ❌ 检查 Gateway 状态/防火墙
    ↓
FHE 加密身份数据
    ↓
调用 registerIdentity()
    ↓
Gas 估算成功？
 ↙         ↘
YES         NO → ❌ 增加 Gas 限制
 ↓
MetaMask 弹出签名
 ↓
用户确认 → ✅ 交易提交
```

---

## 🔍 下一步行动

**立即执行：**

1. **查看浏览器控制台** - 按 F12 查看 Console 标签的错误
2. **应用方案 1** - 降级 FHE SDK 到 0.1.0
3. **清除缓存并重试**

**如果仍然失败：**

1. 复制浏览器控制台的完整错误信息
2. 截图 MetaMask 的错误提示
3. 提供给我进一步诊断

---

## 📞 需要您提供的信息

为了进一步诊断，请提供：

1. **浏览器控制台的错误信息**（F12 → Console）
2. **MetaMask 显示的错误详情**（点击"查看详情"）
3. **Network 标签中失败的请求**（F12 → Network）
4. **您的 MetaMask 当前网络配置**（网络名称、Chain ID、RPC URL）

---

## ✅ 快速检查清单

在开始测试前，请确认：

- [ ] MetaMask 已连接到 Sepolia 测试网
- [ ] MetaMask 账户有足够的 Sepolia ETH（至少 0.01 ETH）
- [ ] 前端开发服务器正在运行（localhost:3000）
- [ ] 浏览器开发者工具已打开（F12）
- [ ] 已清除浏览器缓存或使用隐身窗口

---

**最可能的解决方案：降级 FHE SDK 从 0.2.0 到 0.1.0** ⭐

请先尝试方案 1，然后查看浏览器控制台的输出！
