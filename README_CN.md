<p align="center">
  <img src="privyrep-frontend/public/logo.svg" alt="PrivyRep Logo" width="150"/>
</p>

# PrivyRep - 隐私优先的身份与声誉系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![基于 Zama FHEVM 构建](https://img.shields.io/badge/基于-Zama%20FHEVM-blue)](https://www.zama.ai/)
[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

[English](README.md) | [中文](#)

---

## 🌟 项目概述

**PrivyRep** 是一个基于 **Zama FHEVM (全同态加密虚拟机)** 构建的去中心化身份与声誉系统。它使用户能够在 **不泄露敏感个人信息** 的情况下证明其凭证并建立声誉。

### 🎯 核心特性

- **🔐 隐私保护的身份验证**: 使用 FHE 加密注册和验证身份数据
- **⚡ 零知识声誉评分**: 在不暴露私人数据的情况下建立链上声誉
- **🛡️ 同态比较**: 在加密数据上验证凭证(资产余额、NFT 数量、账户年龄)
- **🔄 双模式架构**:
  - **V1 (演示模式)**: 手动完成 + 自动化 Oracle 模拟
  - **V2 (生产模式)**: 通过 Zama Relayer 实现真正去中心化的 Oracle 回调
- **🎨 精美 UI**: 苹果风格设计，流畅动画和直观的用户体验

---

## 🚀 在线演示

> **注意**: Zama Relayer 的状态可能会影响 V2 功能。使用前请检查状态。

- **在线 Demo**: [即将推出 - 将部署到 Vercel]
- **视频演示**: [即将推出 - 将上传到 YouTube]
- **网络**: Sepolia 测试网

---

## 📋 目录

- [架构设计](#架构设计)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [已部署合约](#已部署合约)
- [V1 vs V2 模式](#v1-vs-v2-模式)
- [项目结构](#项目结构)
- [文档](#文档)
- [贡献指南](#贡献指南)
- [开源协议](#开源协议)

---

## 🏗️ 架构设计

PrivyRep 由三个主要智能合约组成:

```
┌─────────────────────────────────────────────────────────────┐
│                    PrivyRep 系统                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ IdentityProof    │◄────►│ Verification     │           │
│  │ Manager          │      │ Service (V1/V2)  │           │
│  └────────┬─────────┘      └────────┬─────────┘           │
│           │                         │                      │
│           │  加密身份存储           │  FHE 同态比较        │
│           │  (euint32)              │  与验证              │
│           │                         │                      │
│           └─────────┬───────────────┘                      │
│                     │                                       │
│           ┌─────────▼─────────┐                           │
│           │ ReputationScore   │                           │
│           │ (授权访问)        │                           │
│           └───────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **IdentityProofManager**: 使用 FHE 存储加密的身份数据
2. **VerificationService**: 在加密数据上执行同态比较
3. **ReputationScore**: 管理链上声誉评分

---

## 🛠️ 技术栈

### 智能合约
- **Zama FHEVM** 0.8.0 - 以太坊上的全同态加密
- **Hardhat** 2.25.0 - 以太坊开发环境
- **OpenZeppelin Contracts** 5.3.0 - 安全的合约标准
- **Solidity** ^0.8.24

### 前端
- **React** 19.1.1 with TypeScript
- **Vite** 6.3.5 - 下一代前端工具
- **Wagmi** 2.15.6 - 以太坊 React Hooks
- **RainbowKit** 2.2.8 - 精美的钱包连接
- **TailwindCSS** 4.1.16 - 实用优先的 CSS 框架
- **Zama Relayer SDK** 0.2.0 - FHE 客户端库

### 网络
- **Sepolia 测试网** - 以太坊测试网络
- **Zama Gateway** - FHE 解密 Oracle

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 20.0.0
- **npm** 或 **pnpm**
- **MetaMask** 或兼容的 Web3 钱包
- **Sepolia ETH** ([从水龙头获取](https://sepoliafaucet.com/))

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/huaguihai/PrivyRep.git
   cd PrivyRep
   ```

2. **安装合约依赖**
   ```bash
   cd privyrep-contracts
   npm install
   # 或
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 并添加:
   ```env
   PRIVATE_KEY=你的私钥
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/你的INFURA密钥
   ETHERSCAN_API_KEY=你的etherscan_api密钥
   ```

4. **安装前端依赖**
   ```bash
   cd ../privyrep-frontend
   npm install
   ```

5. **配置前端环境** (可选 - 默认使用 V1)
   ```bash
   echo "VITE_USE_V2=false" > .env
   ```

### 本地运行

#### 方式 1: V1 模式 (推荐用于演示)

```bash
# 终端 1: 启动 Oracle 模拟服务
cd privyrep-contracts
npm run oracle

# 终端 2: 启动前端
cd privyrep-frontend
npm run dev
```

#### 方式 2: V2 模式 (需要 Zama Relayer 在线)

```bash
# 首先检查 Relayer 状态
cd privyrep-contracts
npm run check-relayer

# 如果 Relayer 在线 (🟢 OPERATIONAL):
cd ../privyrep-frontend
echo "VITE_USE_V2=true" > .env
npm run dev
```

应用将在 `http://localhost:5173` 可用

---

## 📍 已部署合约

所有合约部署在 **Sepolia 测试网**:

### 共享合约
- **ReputationScore**: [`0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7`](https://sepolia.etherscan.io/address/0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7)
- **IdentityProofManager**: [`0x75DAd365F12563369aE08688c1b6f105255767b0`](https://sepolia.etherscan.io/address/0x75DAd365F12563369aE08688c1b6f105255767b0)

### 版本特定合约
- **VerificationService V1**: [`0xe43D69d358a79E92c9dE402303aE957102090a75`](https://sepolia.etherscan.io/address/0xe43D69d358a79E92c9dE402303aE957102090a75)
- **VerificationService V2**: [`0xFA88cd14F09c7a78C37048cA118C3568c9324768`](https://sepolia.etherscan.io/address/0xFA88cd14F09c7a78C37048cA118C3568c9324768)

---

## 🔄 V1 vs V2 模式

PrivyRep 支持两种运行模式:

| 特性 | V1 (演示模式) | V2 (生产模式) |
|------|---------------|---------------|
| **完成机制** | 手动 `completeVerification()` | 自动 Oracle 回调 |
| **需要 Zama Relayer** | ❌ 否 | ✅ 是 |
| **需要 oracleService.js** | ✅ 是 | ❌ 否 |
| **验证延迟** | 5-30 秒 | 2-10 分钟 |
| **去中心化程度** | 低 (owner 控制) | 高 (Oracle 自动) |
| **使用场景** | 演示 & 测试 | 生产环境 |
| **Gas 消耗** | 较低 | 较高 (Oracle 回调) |

### 模式切换

```bash
# 切换到 V1
echo "VITE_USE_V2=false" > privyrep-frontend/.env

# 切换到 V2
echo "VITE_USE_V2=true" > privyrep-frontend/.env

# 重启前端
npm run dev
```

---

## 📁 项目结构

```
PrivyRep/
├── README.md                       # 英文说明
├── README_CN.md                    # 中文说明(本文件)
├── LICENSE                         # MIT 开源协议
├── .gitignore                      # Git 忽略规则
│
├── privyrep-contracts/             # 智能合约
│   ├── contracts/
│   │   ├── ReputationScore.sol
│   │   ├── IdentityProofManager.sol
│   │   ├── VerificationService.sol      # V1
│   │   └── VerificationServiceV2.sol    # V2
│   ├── scripts/
│   │   ├── deploy.js                    # 部署 V1
│   │   ├── deployV2.js                  # 部署 V2
│   │   ├── oracleService.js             # V1 Oracle 模拟
│   │   └── checkRelayerStatus.js        # Relayer 状态检测
│   ├── deployments/                     # 部署记录
│   ├── hardhat.config.js
│   └── package.json
│
└── privyrep-frontend/              # React 前端
    ├── src/
    │   ├── components/              # React 组件
    │   ├── pages/                   # 页面组件
    │   ├── config/                  # 合约配置
    │   │   ├── contracts.ts         # 版本切换器
    │   │   ├── contractsV1.ts       # V1 地址
    │   │   └── contractsV2.ts       # V2 地址
    │   ├── services/                # FHE & Web3 服务
    │   └── utils/                   # 工具函数
    ├── vite.config.ts
    └── package.json
```

---

## 📚 文档

详细信息请参考:
- 查看上方完整的 README 各章节
- 在合约文件夹运行 `npm run check-relayer` 检查 Zama Relayer 状态
- 使用环境变量 `VITE_USE_V2` 切换 V1/V2 模式
- 参考 [Zama FHEVM 文档](https://docs.zama.ai/fhevm) 了解 FHE 概念

---

## 🎯 工作原理

### 1. 注册加密身份
```solidity
// 用户数据在客户端使用 FHE 加密
euint32 encryptedAge = TFHE.asEuint32(age);
euint32 encryptedAssetBalance = TFHE.asEuint32(assetBalance);
// ... 以加密形式存储在链上
```

### 2. 请求验证
```solidity
// 定义验证标准
uint32 minAssetBalance = 100;
uint32 minNFTCount = 1;
uint32 minAccountAge = 30;
uint32 minTxCount = 10;

// 提交验证请求
verificationService.requestVerification(
    minAssetBalance, minNFTCount, minAccountAge, minTxCount
);
```

### 3. FHE 比较 (在加密数据上!)
```solidity
// 所有比较都在加密数据上进行
ebool assetPass = TFHE.le(minAssetBalance, userAssetBalance);
ebool nftPass = TFHE.le(minNFTCount, userNFTCount);
// ... 不会泄露任何数据!
```

### 4. Oracle 回调 (V2 模式)
```solidity
// Zama Oracle 解密结果并回调
function verificationCallback(uint256 requestId, bool[] memory results)
    public onlyOracle {
    // 基于加密验证更新声誉
    reputationScore.addScore(user, 10);
}
```

---

## 🧪 测试

### 检查 Relayer 状态
```bash
cd privyrep-contracts
npm run check-relayer
```

### 运行合约测试 (即将推出)
```bash
cd privyrep-contracts
npx hardhat test
```

---

## 🌐 部署到 Vercel

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

**手动部署:**

```bash
cd privyrep-frontend
npm run build
# 将 dist/ 文件夹上传到 Vercel
```

**Vercel 环境变量:**
- `VITE_USE_V2`: `false` (如果 Relayer 稳定可设为 `true`)

---

## 🤝 贡献指南

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- **[Zama](https://www.zama.ai/)** - 提供令人惊叹的 FHEVM 技术
- **[Zama 开发者计划](https://www.zama.ai/developer-program)** - 支持本项目
- **[OpenZeppelin](https://www.openzeppelin.com/)** - 提供安全的合约标准

---

## 📞 联系方式

- **GitHub Issues**: [报告问题或请求功能](https://github.com/huaguihai/PrivyRep/issues)
- **Zama Discord**: [加入社区](https://discord.gg/zama)

---

## ⚠️ 重要说明

- 本项目提交至 **Zama 开发者计划 - Builder Track**
- 根据 Zama 要求需要 **Node.js 20+**
- 部署在 **Sepolia 测试网** - 非生产就绪
- V2 功能取决于 Zama Relayer 可用性
- 使用 V1 模式以获得可靠的演示体验

---

**使用 Zama FHEVM 用 ❤️ 构建**

**提交至 Zama 开发者计划 - Builder Track**
