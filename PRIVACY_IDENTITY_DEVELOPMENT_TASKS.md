# PrivyRep - 开发任务清单

## 项目概览

**项目名称**: PrivyRep - Privacy Identity & Reputation System
**技术栈**: Vite + React + TypeScript + Solidity + FHEVM
**开发周期**: 8 周（MVP 4周 + 完整功能 4周）
**团队规模**: 建议 2-3 人（1 前端 + 1 合约 + 1 全栈）

---

## 阶段划分

### Phase 1: MVP（第 1-4 周）
**目标**: 完成基础身份验证和简单声誉系统，能够 Demo 展示

### Phase 2: 完整功能（第 5-8 周）
**目标**: 所有验证类型、证书系统、dApp SDK、治理系统

### Phase 3: 优化与推广（第 9 周+，持续）
**目标**: 性能优化、安全审计、文档完善、社区建设

---

## Phase 1: MVP 开发任务（4 周）

### Week 1: 项目初始化 + 基础合约

#### 任务 1.1: 项目搭建
- [x] **1.1.1 前端项目初始化**（2h）✅ **已完成 2025-10-26**
  - 使用 Vite 创建 React + TypeScript 项目
  - 配置 TailwindCSS
  - 配置 ESLint + Prettier
  - 设置项目目录结构（参考 Zamabelief）
  ```bash
  pnpm create vite privyrep-frontend --template react-ts
  cd privyrep-frontend
  pnpm install
  pnpm add -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

- [x] **1.1.2 合约项目初始化**（1h）✅ **已完成 2025-10-26**
  - 初始化 Hardhat 项目
  - 安装 @fhevm/solidity 依赖
  - 配置 Sepolia 网络
  ```bash
  mkdir privyrep-contracts && cd privyrep-contracts
  pnpm init
  pnpm add -D hardhat @nomicfoundation/hardhat-toolbox
  npx hardhat init
  pnpm add @fhevm/solidity@0.8.0 encrypted-types@0.0.4
  ```

- [ ] **1.1.3 配置 Git & GitHub**（0.5h）⏸️ **待完成**
  - 创建 GitHub 仓库
  - 配置 .gitignore
  - 创建 README.md
  - 推送初始代码

#### 任务 1.2: 核心合约开发（MVP 版本）
- [x] **1.2.1 ReputationScore.sol**（3h）✅ **已完成 2025-10-26**
  - 实现基础数据结构（Reputation struct）
  - 实现 addScore / deductScore 函数
  - 实现 getLevel 函数（5 个等级）
  - 编写单元测试（Hardhat test）
  - **验收标准**: 测试覆盖率 > 80%

- [x] **1.2.2 IdentityProofManager.sol**（6h）✅ **已完成 2025-10-26**
  - 实现 EncryptedIdentity 结构体
  - 实现 registerIdentity 函数（接收加密输入）
  - 实现 updateAssetBalance 函数
  - 集成 FHE 库（asEuint32, isAllowed）
  - 编写单元测试
  - **验收标准**: 能够存储和读取加密数据
  - **技术细节**: 使用 @fhevm/solidity@0.8.0 + encrypted-types@0.0.4

- [x] **1.2.3 VerificationService.sol（简化版）**（8h）✅ **已完成 2025-10-26**
  - 实现 requestVerification 函数
  - 实现 FHE 比较逻辑（FHE.ge, FHE.and）
  - 实现 completeVerification 函数（链下处理）
  - 编写集成测试
  - **验收标准**: 能够完成端到端验证流程
  - **技术细节**: 使用 FHE.ge() 进行加密比较

- [x] **1.2.4 部署脚本**（2h）✅ **已完成 2025-10-26**
  - 编写 deploy.js 脚本
  - 部署到 Sepolia Testnet
  - 验证合约（Etherscan）
  - 记录合约地址到配置文件
  - **已部署地址**:
    - ReputationScore: `0xA2a3110d115CB9a018556C34103E0adaFE17A5f5`
    - IdentityProofManager: `0xdF9302E2bcA724211c7A7EF140DD2f4620576d74`
    - VerificationService: `0x2ADC0332CC8e59140ca88e459E2C8d3d4375aC19`

---

### Week 2: 前端核心功能 ✅ **已完成 2025-10-26**

#### 任务 2.1: 钱包连接 & FHE 初始化
- [x] **2.1.1 配置 Wagmi + RainbowKit**（3h）✅ **已完成**
  - 安装依赖
  ```bash
  pnpm add wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
  ```
  - 配置 WagmiConfig（参考 Zamabelief）
  - 配置 Sepolia 网络和 RPC
  - 实现 ConnectButton 组件
  - **验收标准**: 能够连接 MetaMask 并显示余额

- [x] **2.1.2 FHE Service 实现**（5h）✅ **已完成**
  - 安装 @zama-fhe/relayer-sdk@0.2.0
  - 实现 initializeFheInstance 函数
  - 实现 getFhevmInstance 函数（单例模式）
  - 实现 encryptIdentityData 函数（4 个字段）
  - 添加错误处理和重试逻辑
  - **验收标准**: 能够成功加密数据并打印 ciphertext
  - **文件位置**: `src/services/fheService.ts`

- [x] **2.1.3 Vite 配置优化**（2h）✅ **已完成**
  - 配置 Node.js polyfills
  - 配置 global 变量
  - 配置 WASM 支持
  - 添加 TypeScript 类型声明
  - **文件位置**: `vite.config.ts`, `src/vite-env.d.ts`

#### 任务 2.2: 用户身份注册页面
- [x] **2.2.1 注册表单 UI**（4h）✅ **已完成**
  - 创建 IdentityRegistration.tsx 组件
  - 4 个输入字段（assetBalance, nftCount, accountAge, txCount）
  - 实现 PrivacyNotice 组件（说明加密原理）
  - 实现提交按钮（连接 FHE Service）
  - **验收标准**: UI 美观，交互流畅
  - **文件位置**: `src/components/IdentityRegistration.tsx`

- [x] **2.2.2 注册流程集成**（5h）✅ **已完成**
  - 使用 useWriteContract hook
  - 调用 encryptIdentityData 进行 FHE 加密
  - 调用合约 registerIdentity
  - 监听交易状态（useWaitForTransactionReceipt）
  - 显示加载状态（Encrypting → Submitting → Confirming）
  - 集成 react-hot-toast 通知
  - **验收标准**: 能够完成端到端注册

#### 任务 2.3: 声誉展示页面
- [x] **2.3.1 声誉卡片组件**（3h）✅ **已完成**
  - 创建 ReputationDisplay.tsx
  - 读取合约 getScore(address) 数据
  - 展示分数、等级、进度条
  - 显示注册状态和验证次数
  - 添加等级徽章和说明
  - **验收标准**: 数据实时更新
  - **文件位置**: `src/components/ReputationDisplay.tsx`

#### 任务 2.4: 验证功能页面
- [x] **2.4.1 创建验证请求表单**（3h）✅ **已完成**
  - 创建 VerificationRequest.tsx
  - 输入字段：minAssetBalance, minNFTCount, minAccountAge, minTxCount
  - 调用 VerificationService.requestVerification
  - 获取 requestId 和交易哈希
  - **验收标准**: 能够提交验证请求
  - **文件位置**: `src/components/VerificationRequest.tsx`

- [x] **2.4.2 主应用集成**（2h）✅ **已完成**
  - 更新 App.tsx，添加 Tab 导航
  - 集成 3 个主要组件（注册、声誉、验证）
  - 添加 Toaster 通知系统
  - 显示合约地址信息
  - **验收标准**: 所有功能可访问
  - **文件位置**: `src/App.tsx`

---

### Week 3: 验证流程 & Dashboard

#### 任务 3.1: 验证请求页面（模拟 dApp）
- [ ] **3.1.1 创建验证请求表单**（3h）
  - 创建 VerifyPage.tsx
  - 输入字段：userAddress, assetThreshold, reputationMin
  - 调用 VerificationService.requestVerification
  - 获取 requestId
  - **验收标准**: 能够提交验证请求

- [ ] **3.1.2 验证状态监控**（4h）
  - 实现 useWatchContractEvent 监听 VerificationCompleted
  - 轮询查询验证结果（isPending）
  - 显示实时状态（Pending → Processing → Completed）
  - 展示最终结果（Pass/Fail）
  - **验收标准**: 能够实时看到验证进度

- [ ] **3.1.3 Oracle 回调测试**（3h）
  - 使用 Sepolia Testnet 测试完整流程
  - 记录 Oracle 回调延迟时间
  - 处理超时情况（> 2 分钟）
  - **验收标准**: 回调成功率 > 90%

#### 任务 3.2: 用户 Dashboard
- [ ] **3.2.1 声誉卡片组件**（3h）
  - 创建 ReputationCard.tsx
  - 读取合约 reputations(address) 数据
  - 展示分数、等级、进度条
  - 添加等级徽章图标
  - **验收标准**: 数据实时更新

- [ ] **3.2.2 身份信息展示**（2h）
  - 创建 IdentityStatus.tsx
  - 显示是否已注册
  - 显示注册时间（从事件读取）
  - **验收标准**: 已注册用户显示绿色状态

- [ ] **3.2.3 活动时间线**（4h）
  - 创建 ActivityTimeline.tsx
  - 读取 ScoreChanged 事件历史
  - 展示加分/减分记录（时间、原因、金额）
  - 实现分页或无限滚动
  - **验收标准**: 能够查看最近 20 条记录

---

### Week 4: MVP 完善 & 测试

#### 任务 4.1: UI/UX 优化
- [ ] **4.1.1 设计系统统一**（3h）
  - 定义颜色变量（参考 Zamabelief 的深色主题）
  - 统一按钮样式（primary/secondary/danger）
  - 统一卡片样式（gradient border）
  - 添加加载动画组件

- [ ] **4.1.2 响应式适配**（3h）
  - 适配移动端布局（<768px）
  - 测试 iPad 横竖屏
  - 优化 Touch 交互
  - **验收标准**: 在 iPhone/iPad 上可用

- [ ] **4.1.3 错误处理 UI**（2h）
  - 实现 Toast 通知（react-hot-toast）
  - 实现错误边界（ErrorBoundary）
  - 友好的错误提示文案
  - **验收标准**: 所有错误都有提示

#### 任务 4.2: 集成测试
- [ ] **4.2.1 端到端测试脚本**（4h）
  - 场景 1: 新用户注册身份
  - 场景 2: dApp 请求验证（通过）
  - 场景 3: dApp 请求验证（失败）
  - 场景 4: 查看 Dashboard
  - **验收标准**: 4 个场景全部通过

- [ ] **4.2.2 性能测试**（2h）
  - 测试加密耗时（目标 < 5 秒）
  - 测试页面加载速度（Lighthouse）
  - 测试并发验证（10 个请求）
  - **验收标准**: 加密 < 5s，Lighthouse > 80

- [ ] **4.2.3 Bug 修复**（4h）
  - 修复测试中发现的所有 bug
  - 代码 review
  - 补充缺失的注释

#### 任务 4.3: MVP Demo 准备
- [ ] **4.3.1 Demo 视频录制**（2h）
  - 录制 3 分钟演示视频
  - 展示核心功能（注册 → 验证 → Dashboard）
  - 强调隐私保护特性
  - 添加字幕和配音

- [ ] **4.3.2 README 文档**（2h）
  - 项目介绍
  - 技术架构图
  - 快速开始指南
  - 部署教程
  - **验收标准**: 新人能够根据文档部署

- [ ] **4.3.3 部署到测试环境**（2h）
  - 前端部署到 Vercel
  - 配置自定义域名（可选）
  - 测试线上环境
  - **验收标准**: Demo 链接可访问

---

## Phase 2: 完整功能开发（4 周）

### Week 5: 证书系统 (SBT)

#### 任务 5.1: CredentialNFT 合约
- [ ] **5.1.1 合约开发**（6h）
  - 继承 ERC721（OpenZeppelin）
  - 实现 Soulbound 逻辑（禁止转移）
  - 实现 issueCredential 函数
  - 实现 revokeCredential 函数
  - 实现 isCredentialValid 函数（检查过期）
  - **验收标准**: 单元测试覆盖率 > 85%

- [ ] **5.1.2 证书元数据设计**（3h）
  - 设计 4 种证书类型（KYC/资产/活跃/开发者）
  - 使用 IPFS 存储 NFT 图片
  - 实现 tokenURI 函数（返回 JSON metadata）
  - **验收标准**: OpenSea 能够正确显示

- [ ] **5.1.3 与 VerificationService 集成**（4h）
  - 修改 VerificationService，验证通过后自动发放证书
  - 实现证书类型判断逻辑
  - 测试自动发放流程
  - **验收标准**: 验证通过后自动 mint NFT

#### 任务 5.2: 证书前端页面
- [ ] **5.2.1 我的证书页面**（5h）
  - 创建 MyCredentials.tsx
  - 读取用户持有的所有 NFT（tokenIds）
  - 展示证书卡片（类型、颁发时间、有效期）
  - 实现证书详情弹窗
  - **验收标准**: 能够查看所有证书

- [ ] **5.2.2 证书展示组件**（3h）
  - 创建 CredentialCard.tsx
  - 实现不同类型的证书样式
  - 添加有效期倒计时
  - 添加已撤销标记
  - **验收标准**: UI 美观，信息完整

---

### Week 6: 多种验证类型

#### 任务 6.1: NFT 持有验证
- [ ] **6.1.1 合约扩展**（4h）
  - IdentityProofManager 添加 NFT 验证函数
  - 集成 ERC721 接口查询 balanceOf
  - 实现 verifyNFTOwnership 函数
  - **验收标准**: 能够验证 NFT 持有量

- [ ] **6.1.2 前端支持**（3h）
  - 添加 NFT 验证选项
  - 输入 NFT 合约地址
  - 调用 NFT 验证接口
  - **验收标准**: 能够验证 BAYC/Azuki 等 NFT

#### 任务 6.2: 时间证明
- [ ] **6.2.1 账户年龄验证**（3h）
  - 实现 calculateAccountAge 函数
  - 链上存储首次交易时间（或通过事件推断）
  - 实现 FHE 比较（accountAge >= minAge）
  - **验收标准**: 能够验证账户 > 1 年

- [ ] **6.2.2 持有时长验证**（4h）
  - 追踪资产首次转入时间
  - 计算持有天数
  - 实现 FHE 比较
  - **验收标准**: 能够验证持有 ETH > 6 个月

#### 任务 6.3: 交易活跃度证明
- [ ] **6.3.1 交易计数验证**（3h）
  - 读取 publicClient.getTransactionCount
  - 加密并存储到合约
  - 实现 FHE 比较（txCount >= minTx）
  - **验收标准**: 能够验证交易次数 > 100

- [ ] **6.3.2 协议交互验证**（5h）
  - 集成 Dune Analytics API（或 The Graph）
  - 查询用户与特定协议的交互次数
  - 实现验证逻辑
  - **验收标准**: 能够验证 Uniswap 交易 > 10 次

---

### Week 7: dApp 集成 SDK

#### 任务 7.1: SDK 开发
- [ ] **7.1.1 SDK 项目初始化**（2h）
  - 创建 @privyrep/sdk 包（TypeScript）
  - 配置 tsup 打包工具
  - 配置 npm 发布
  ```bash
  mkdir privyrep-sdk && cd privyrep-sdk
  pnpm init
  pnpm add -D tsup typescript
  ```

- [ ] **7.1.2 SDK 核心类实现**（6h）
  - 实现 PrivyRepSDK 类
  - 实现 requestVerification 方法
  - 实现 getVerificationResult 方法
  - 实现事件监听（onVerificationCompleted）
  - 添加 TypeScript 类型定义
  - **验收标准**: 能够通过 SDK 调用合约

- [ ] **7.1.3 SDK 文档**（3h）
  - 编写 API 文档
  - 编写快速开始指南
  - 提供代码示例（Next.js/Vite）
  - **验收标准**: 开发者能够快速集成

#### 任务 7.2: 示例 dApp
- [ ] **7.2.1 创建 Example dApp**（5h）
  - 创建一个简单的空投 dApp
  - 集成 @privyrep/sdk
  - 实现白名单验证（资产 > 5 ETH）
  - 验证通过后允许 Claim
  - **验收标准**: 能够演示完整集成流程

- [ ] **7.2.2 Webhook 通知**（4h）
  - 实现后端 Webhook 接收器（Express.js）
  - 监听 VerificationCompleted 事件
  - 发送 POST 请求到 dApp 后端
  - **验收标准**: dApp 能够实时收到通知

---

### Week 8: 治理 & 优化

#### 任务 8.1: 治理系统
- [ ] **8.1.1 参数调整合约**（4h）
  - 实现 Governance.sol
  - 支持调整加分/减分规则
  - 支持多签（Gnosis Safe 集成）
  - **验收标准**: 能够通过投票修改参数

- [ ] **8.1.2 争议仲裁流程**（3h）
  - 实现 reportUser 函数（举报）
  - 实现 reviewReport 函数（审核）
  - 实现仲裁结果执行
  - **验收标准**: 能够处理恶意用户

#### 任务 8.2: Gas 优化
- [ ] **8.2.1 合约 Gas 优化**（4h）
  - 使用 Hardhat Gas Reporter
  - 优化存储布局（packed storage）
  - 减少冗余的 SLOAD/SSTORE
  - **验收标准**: Gas 消耗降低 > 20%

- [ ] **8.2.2 批量操作**（3h）
  - 实现 batchVerify（一次验证多个用户）
  - 实现 batchUpdateScore
  - **验收标准**: 批量操作 Gas 效率提升 > 30%

#### 任务 8.3: 前端性能优化
- [ ] **8.3.1 WASM 缓存**（2h）
  - 实现 WASM 模块 localStorage 缓存
  - 减少重复加载时间
  - **验收标准**: 二次加载 < 1 秒

- [ ] **8.3.2 代码分割**（2h）
  - 使用 React.lazy 懒加载页面
  - 优化打包体积
  - **验收标准**: 首屏加载 < 3 秒

- [ ] **8.3.3 并行加密**（3h）
  - 使用 Promise.all 并行加密多个字段
  - **验收标准**: 加密时间缩短 > 40%

---

## Phase 3: 优化与推广（持续）

### 任务 9: 安全审计
- [ ] **9.1 自动化安全扫描**（2h）
  - 运行 Slither 静态分析
  - 运行 Mythril 符号执行
  - 修复高危漏洞

- [ ] **9.2 代码审计**（外包，2 周）
  - 联系审计公司（如 OpenZeppelin/Trail of Bits）
  - 提交合约代码
  - 修复审计报告中的问题

- [ ] **9.3 Bug Bounty**（持续）
  - 在 Immunefi 创建赏金计划
  - 设置奖金池（$10k - $50k）

### 任务 10: 文档完善
- [ ] **10.1 用户文档**（3h）
  - 如何注册身份
  - 如何提升声誉
  - 如何获取证书
  - FAQ

- [ ] **10.2 开发者文档**（4h）
  - 智能合约 API 文档
  - SDK 集成指南
  - 最佳实践

- [ ] **10.3 视频教程**（5h）
  - 用户操作教程（5 分钟）
  - 开发者集成教程（10 分钟）
  - 上传到 YouTube

### 任务 11: 社区建设
- [ ] **11.1 社交媒体**（持续）
  - 创建 Twitter 账号
  - 创建 Discord 服务器
  - 每周发布技术文章

- [ ] **11.2 早期用户激励**（1 周）
  - 设计积分空投计划
  - 前 100 名用户奖励 NFT
  - 推荐奖励机制

- [ ] **11.3 Hackathon 参与**（1 周）
  - 准备 Zama Bounty 提交材料
  - 准备 Demo Day 演讲稿
  - 制作 Pitch Deck

---

## 关键里程碑

| 里程碑 | 日期 | 交付物 | 成功标准 |
|-------|------|--------|---------|
| **M1: 项目启动** | Week 1 结束 | 合约部署 + 前端框架 | 能够跑通 Hello World |
| **M2: MVP Alpha** | Week 2 结束 | 注册 + 验证流程 | 端到端流程打通 |
| **M3: MVP Beta** | Week 3 结束 | Dashboard + 完整 UI | 可以给用户试用 |
| **M4: MVP Release** | Week 4 结束 | Demo 视频 + 部署 | 可以参加比赛 |
| **M5: 完整功能 Alpha** | Week 6 结束 | 证书 + 多种验证 | 核心功能完整 |
| **M6: SDK 发布** | Week 7 结束 | NPM 包 + 文档 | dApp 可以集成 |
| **M7: V1.0 Release** | Week 8 结束 | 审计 + 优化 | 生产环境可用 |

---

## 团队分工建议

### 角色 1: 智能合约工程师
**职责**:
- Week 1-2: 开发核心合约
- Week 3-4: 合约集成测试
- Week 5-6: 证书系统 + 扩展验证
- Week 7-8: 治理系统 + Gas 优化

**技能要求**: Solidity, Hardhat, FHE, 安全审计经验

---

### 角色 2: 前端工程师
**职责**:
- Week 1-2: FHE Service + 钱包连接
- Week 3-4: Dashboard + UI 优化
- Week 5-6: 证书页面 + 响应式
- Week 7-8: 性能优化 + 文档

**技能要求**: React, TypeScript, Wagmi, TailwindCSS, FHE SDK

---

### 角色 3: 全栈工程师（可选）
**职责**:
- Week 1-8: 协助前后端
- Week 5-6: 数据采集（API 集成）
- Week 7: SDK 开发
- Week 8: Webhook 服务器

**技能要求**: Node.js, Express, ethers.js, API 集成

---

## 风险与应对

| 风险 | 缓解措施 |
|-----|---------|
| **FHE 计算超时** | 提前测试 Sepolia 环境性能，准备降级方案 |
| **Oracle 回调失败** | 实现重试机制，超时提醒用户 |
| **API 限流（Alchemy/Etherscan）** | 使用多个 API Key，实现请求缓存 |
| **合约漏洞** | 尽早启动审计，购买审计保险 |
| **进度延期** | 每周 Review，及时调整优先级 |

---

## 开发工具清单

### 必需工具
- [ ] MetaMask 钱包（测试用）
- [ ] Hardhat（合约开发）
- [ ] Vite（前端开发）
- [ ] Vercel 账号（前端部署）
- [ ] Alchemy 账号（RPC + NFT API）
- [ ] Etherscan API Key
- [ ] GitHub 账号

### 推荐工具
- [ ] Remix IDE（快速合约测试）
- [ ] Tenderly（合约调试）
- [ ] Postman（API 测试）
- [ ] Figma（UI 设计）
- [ ] Notion（项目管理）
- [ ] Sentry（错误监控）

---

## 验收清单（MVP）

在提交 Demo 前，确保以下所有项目都已完成：

### 功能验收
- [ ] 用户可以连接钱包
- [ ] 用户可以注册身份（提交加密数据）
- [ ] dApp 可以请求验证
- [ ] 验证结果正确返回（Pass/Fail）
- [ ] Dashboard 显示声誉分数
- [ ] 所有按钮和链接都可用

### 性能验收
- [ ] 加密时间 < 10 秒
- [ ] 页面加载 < 5 秒
- [ ] Lighthouse 分数 > 70

### 安全验收
- [ ] 合约通过 Slither 扫描
- [ ] 敏感数据已加密
- [ ] 无 console.error 输出

### 文档验收
- [ ] README 完整
- [ ] 合约有注释
- [ ] 前端代码有注释
- [ ] Demo 视频录制完成

---

## Phase 4: 国际化与优化（低优先级）

### 任务 12: 前端国际化支持（i18n）

#### 任务 12.1: i18n 基础设施搭建
- [ ] **12.1.1 安装 i18n 依赖**（1h）
  ```bash
  pnpm add react-i18next i18next i18next-browser-languagedetector
  ```
  - 配置 i18next 初始化
  - 创建 `src/i18n/config.ts`
  - 实现语言检测器（浏览器语言优先）
  - **验收标准**: i18n 系统正常工作

- [ ] **12.1.2 创建翻译文件**（2h）
  - 创建 `src/i18n/locales/en.json`（英文，默认）
  - 创建 `src/i18n/locales/zh.json`（中文）
  - 定义 JSON 结构（按功能模块组织）
  - **验收标准**: 翻译文件结构清晰

#### 任务 12.2: 英文翻译（默认语言）
- [ ] **12.2.1 App.tsx 英文化**（1h）
  - 导航栏标题和副标题
  - Tab 导航标签
  - 功能卡片文案
  - 合约地址说明
  - **文件**: `src/i18n/locales/en.json`

- [ ] **12.2.2 IdentityRegistration 组件英文化**（1.5h）
  - 页面标题和说明
  - 表单标签和占位符
  - 按钮文本和状态提示
  - 隐私保护说明
  - **文件**: `src/components/IdentityRegistration.tsx`

- [ ] **12.2.3 ReputationDisplay 组件英文化**（1h）
  - 声誉卡片文案
  - 统计信息标签
  - 等级说明
  - 提升声誉小贴士
  - **文件**: `src/components/ReputationDisplay.tsx`

- [ ] **12.2.4 VerificationRequest 组件英文化**（1.5h）
  - 表单标题和说明
  - 验证流程说明
  - 输入字段标签和提示
  - 隐私保护说明
  - **文件**: `src/components/VerificationRequest.tsx`

- [ ] **12.2.5 Toast 通知英文化**（0.5h）
  - 成功/错误/警告提示
  - 加载状态文案
  - **文件**: 各组件中的 toast 调用

#### 任务 12.3: 中文翻译
- [ ] **12.3.1 完整中文翻译**（2h）
  - 将所有英文翻译为中文
  - 保持当前页面的中文文案
  - 确保语境准确、专业
  - **文件**: `src/i18n/locales/zh.json`

- [ ] **12.3.2 验证中文显示**（0.5h）
  - 测试所有页面和组件
  - 检查中文排版和字体
  - 确保无乱码和断字问题

#### 任务 12.4: 语言切换功能
- [ ] **12.4.1 创建语言切换组件**（2h）
  - 创建 `src/components/LanguageSwitch.tsx`
  - 下拉菜单或开关按钮
  - 显示当前语言
  - 切换后自动刷新页面文本
  - **验收标准**: 切换流畅，无闪烁

- [ ] **12.4.2 集成到导航栏**（0.5h）
  - 将语言切换按钮添加到导航栏
  - 位置：ConnectButton 旁边
  - 响应式适配（移动端优化）
  - **验收标准**: 在所有设备上可用

#### 任务 12.5: 持久化与测试
- [ ] **12.5.1 语言选择持久化**（1h）
  - 使用 localStorage 存储用户语言偏好
  - 页面刷新后保持选择
  - **验收标准**: 刷新后语言不变

- [ ] **12.5.2 i18n 测试**（1h）
  - 测试所有页面切换
  - 测试动态文本（如日期、数字）
  - 测试 RTL 语言兼容性（预留）
  - **验收标准**: 所有文本正确显示

---

### 任务 13: 国际化相关优化

#### 任务 13.1: 多语言 SEO
- [ ] **13.1.1 HTML lang 属性**（0.5h）
  - 根据当前语言动态设置 `<html lang="...">`
  - **文件**: `index.html`

- [ ] **13.1.2 元数据翻译**（0.5h）
  - `<title>` 和 `<meta description>` 多语言支持
  - **文件**: `index.html` + i18n 配置

#### 任务 13.2: 数字和日期格式化
- [ ] **13.2.1 数字格式化**（1h）
  - 使用 `Intl.NumberFormat` 格式化数字
  - 英文：1,000 | 中文：1,000
  - **文件**: 创建 `src/utils/formatNumber.ts`

- [ ] **13.2.2 日期格式化**（1h）
  - 使用 `Intl.DateTimeFormat` 格式化日期
  - 英文：Oct 26, 2025 | 中文：2025年10月26日
  - **文件**: 创建 `src/utils/formatDate.ts`

---

### i18n 翻译文件示例结构

#### `src/i18n/locales/en.json`（英文，默认）
```json
{
  "nav": {
    "title": "PrivyRep",
    "subtitle": "Privacy Identity & Reputation"
  },
  "tabs": {
    "reputation": "My Reputation",
    "register": "Register Identity",
    "verify": "Identity Verification"
  },
  "featureCards": {
    "encryption": {
      "title": "Encrypted Identity",
      "description": "Protect your sensitive data with Fully Homomorphic Encryption"
    },
    "reputation": {
      "title": "Reputation System",
      "description": "Build trustworthy on-chain reputation records"
    },
    "verification": {
      "title": "Privacy Verification",
      "description": "Prove your identity without revealing data"
    }
  },
  "register": {
    "title": "Register Encrypted Identity",
    "description": "Your data will be encrypted using Fully Homomorphic Encryption (FHE) to ensure privacy and security",
    "connectWallet": "Please connect your wallet to register your identity",
    "fields": {
      "assetBalance": {
        "label": "Asset Balance",
        "placeholder": "Enter your asset balance",
        "hint": "e.g., 1000 (will be encrypted)"
      },
      "nftCount": {
        "label": "NFT Count",
        "placeholder": "Enter the number of NFTs you own",
        "hint": "e.g., 5 (will be encrypted)"
      },
      "accountAge": {
        "label": "Account Age (in Days)",
        "placeholder": "Enter account age in days",
        "hint": "e.g., 365 means your account is 1 year old (will be encrypted)"
      },
      "txCount": {
        "label": "Transaction Count",
        "placeholder": "Enter your historical transaction count",
        "hint": "e.g., 100 (will be encrypted)"
      }
    },
    "buttons": {
      "encrypting": "🔐 Encrypting...",
      "signing": "📝 Waiting for signature...",
      "confirming": "⏳ Confirming...",
      "register": "🚀 Register Identity"
    },
    "privacy": {
      "title": "Privacy Protection",
      "points": [
        "✅ All data encrypted with Fully Homomorphic Encryption (FHE)",
        "✅ Data stored on-chain in encrypted form",
        "✅ Only you and authorized smart contracts can process encrypted data",
        "✅ Others cannot view your original data"
      ]
    }
  },
  "reputation": {
    "title": "My Reputation",
    "refresh": "🔄 Refresh",
    "loading": "Loading...",
    "currentScore": "Current Reputation Score",
    "points": "points",
    "stats": {
      "status": "Registration Status",
      "registered": "✅ Registered",
      "notRegistered": "❌ Not Registered",
      "verifications": "Verification Count"
    },
    "levels": {
      "title": "Reputation Level Description",
      "beginner": "Beginner User - Just starting to build reputation",
      "active": "Active User - Has a solid reputation foundation",
      "advanced": "Advanced User - Well-reputed and trusted"
    },
    "tips": {
      "title": "💡 Tips to Improve Reputation",
      "points": [
        "✅ Complete identity registration (+10 base score)",
        "✅ Pass identity verification (+extra score based on criteria)",
        "✅ Maintain good on-chain behavior",
        "✅ Regularly update your identity information"
      ]
    },
    "privacy": "Your reputation score is public, but your identity data remains encrypted"
  },
  "verify": {
    "title": "Identity Verification Request",
    "description": "Set verification criteria, the system will use FHE to compare your identity data in encrypted form",
    "connectWallet": "Please connect your wallet to request verification",
    "process": {
      "title": "Verification Process",
      "steps": [
        "Set the verification criteria you want to meet",
        "Submit verification request to smart contract",
        "System uses FHE to compare your data with criteria in encrypted form",
        "If verification passes, you will receive reputation score rewards"
      ]
    },
    "fields": {
      "minAssetBalance": {
        "label": "Min Asset Balance",
        "placeholder": "e.g., 100",
        "hint": "Your asset balance must be ≥ this value to pass verification"
      },
      "minNFTCount": {
        "label": "Min NFT Count",
        "placeholder": "e.g., 1",
        "hint": "Your NFT count must be ≥ this value to pass verification"
      },
      "minAccountAge": {
        "label": "Min Account Age (in Days)",
        "placeholder": "e.g., 30",
        "hint": "Your account age must be ≥ this value to pass verification"
      },
      "minTxCount": {
        "label": "Min Transaction Count",
        "placeholder": "e.g., 10",
        "hint": "Your transaction count must be ≥ this value to pass verification"
      }
    },
    "buttons": {
      "signing": "📝 Waiting for signature...",
      "confirming": "⏳ Confirming...",
      "submit": "✅ Submit Verification Request"
    },
    "privacy": {
      "title": "Privacy Protection",
      "points": [
        "✅ All comparisons performed on encrypted data",
        "✅ Verifiers can only see 'Pass' or 'Fail' results",
        "✅ Your specific data values remain encrypted",
        "✅ Achieves zero-knowledge proof-like verification experience"
      ]
    }
  },
  "contracts": {
    "title": "Contract Addresses (Sepolia Testnet)"
  },
  "toast": {
    "connectWallet": "Please connect your wallet first",
    "invalidValues": "All values must be greater than or equal to 0",
    "encrypting": "Encrypting identity data...",
    "encryptionComplete": "Encryption complete! Submitting transaction...",
    "registrationSuccess": "Identity registration successful!",
    "registrationFailed": "Registration failed",
    "verifyingRequest": "Submitting verification request...",
    "verificationSubmitted": "Verification request submitted! Please wait for off-chain processing",
    "transactionFailed": "Transaction failed"
  }
}
```

#### `src/i18n/locales/zh.json`（中文）
```json
{
  "nav": {
    "title": "PrivyRep",
    "subtitle": "隐私身份与声誉系统"
  },
  "tabs": {
    "reputation": "我的声誉",
    "register": "注册身份",
    "verify": "身份验证"
  },
  // ... （保持当前中文文案）
}
```

---

### i18n 优先级说明

**🔴 高优先级（MVP）**:
- Week 1-2 的核心功能（✅ 已完成，默认中文）

**🟡 中优先级**:
- Week 3-4 的 UI/UX 优化
- Week 5-8 的扩展功能

**🟢 低优先级（Phase 4）**:
- ⏸️ 国际化支持（i18n）
- ⏸️ 多语言界面（英文默认 + 中文）
- ⏸️ 语言切换功能

**实施建议**:
1. **现在**: 保持当前中文界面，专注于功能开发和测试
2. **MVP 完成后**: 将所有中文文案提取为翻译键
3. **上线前**: 添加英文翻译，实现语言切换
4. **长期**: 支持更多语言（日语、韩语等）

---

**文档版本**: v1.1
**最后更新**: 2025-10-26
**作者**: PrivyRep Team
**状态**: Week 1-2 已完成，Phase 4 待执行
