<p align="center">
  <img src="privyrep-frontend/public/logo.svg" alt="PrivyRep Logo" width="150"/>
</p>

# PrivyRep - Privacy-First Identity & Reputation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Zama FHEVM](https://img.shields.io/badge/Built%20with-Zama%20FHEVM-blue)](https://www.zama.ai/)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

[English](#english) | [中文](#chinese)

---

<a id="english"></a>

## 🌟 Overview

**PrivyRep** is a decentralized identity and reputation system built on **Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine)**. It enables users to prove their credentials and build reputation **without revealing sensitive personal information**.

### 🎯 Key Features

- **🔐 Privacy-Preserving Identity Verification**: Register and verify identity data encrypted with FHE
- **⚡ Zero-Knowledge Reputation Score**: Build on-chain reputation without exposing private data
- **🛡️ Homomorphic Comparisons**: Verify credentials (asset balance, NFT count, account age) on encrypted data
- **🔄 Dual-Mode Architecture**:
  - **V1 (Demo Mode)**: Manual completion with automated Oracle simulation
  - **V2 (Production Mode)**: True decentralized Oracle callback via Zama Relayer
- **🎨 Beautiful UI**: Apple-inspired design with smooth animations and intuitive UX

---

## 🚀 Live Demo

> **Note**: Zama Relayer status may affect V2 functionality. Check status before use.

- **Live Demo**: [Coming Soon - Will be deployed to Vercel]
- **Video Demo**: [Coming Soon - Will be uploaded to YouTube]
- **Network**: Sepolia Testnet

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployed Contracts](#deployed-contracts)
- [V1 vs V2 Modes](#v1-vs-v2-modes)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🏗️ Architecture

PrivyRep consists of three main smart contracts:

```
┌─────────────────────────────────────────────────────────────┐
│                    PrivyRep System                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ IdentityProof    │◄────►│ Verification     │           │
│  │ Manager          │      │ Service (V1/V2)  │           │
│  └────────┬─────────┘      └────────┬─────────┘           │
│           │                         │                      │
│           │  Encrypted Identity     │  FHE Comparisons    │
│           │  Storage (euint32)      │  & Verification     │
│           │                         │                      │
│           └─────────┬───────────────┘                      │
│                     │                                       │
│           ┌─────────▼─────────┐                           │
│           │ ReputationScore   │                           │
│           │ (Authorized)      │                           │
│           └───────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **IdentityProofManager**: Stores encrypted identity data using FHE
2. **VerificationService**: Performs homomorphic comparisons on encrypted data
3. **ReputationScore**: Manages on-chain reputation scores

---

## 🛠️ Tech Stack

### Smart Contracts
- **Zama FHEVM** 0.8.0 - Fully Homomorphic Encryption on Ethereum
- **Hardhat** 2.25.0 - Ethereum development environment
- **OpenZeppelin Contracts** 5.3.0 - Secure contract standards
- **Solidity** ^0.8.24

### Frontend
- **React** 19.1.1 with TypeScript
- **Vite** 6.3.5 - Next-generation frontend tooling
- **Wagmi** 2.15.6 - React Hooks for Ethereum
- **RainbowKit** 2.2.8 - Beautiful wallet connection
- **TailwindCSS** 4.1.16 - Utility-first CSS framework
- **Zama Relayer SDK** 0.2.0 - FHE client library

### Network
- **Sepolia Testnet** - Ethereum test network
- **Zama Gateway** - FHE decryption Oracle

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **pnpm**
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** ([Get from faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/huaguihai/PrivyRep.git
   cd PrivyRep
   ```

2. **Install contract dependencies**
   ```bash
   cd privyrep-contracts
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```env
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../privyrep-frontend
   npm install
   ```

5. **Configure frontend environment** (Optional - defaults to V1)
   ```bash
   echo "VITE_USE_V2=false" > .env
   ```

### Running Locally

#### Option 1: V1 Mode (Recommended for Demo)

```bash
# Terminal 1: Start Oracle simulation service
cd privyrep-contracts
npm run oracle

# Terminal 2: Start frontend
cd privyrep-frontend
npm run dev
```

#### Option 2: V2 Mode (Requires Zama Relayer Online)

```bash
# Check Relayer status first
cd privyrep-contracts
npm run check-relayer

# If Relayer is online (🟢 OPERATIONAL):
cd ../privyrep-frontend
echo "VITE_USE_V2=true" > .env
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📍 Deployed Contracts

All contracts are deployed on **Sepolia Testnet**:

### Shared Contracts
- **ReputationScore**: [`0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7`](https://sepolia.etherscan.io/address/0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7)
- **IdentityProofManager**: [`0x75DAd365F12563369aE08688c1b6f105255767b0`](https://sepolia.etherscan.io/address/0x75DAd365F12563369aE08688c1b6f105255767b0)

### Version-Specific Contracts
- **VerificationService V1**: [`0xe43D69d358a79E92c9dE402303aE957102090a75`](https://sepolia.etherscan.io/address/0xe43D69d358a79E92c9dE402303aE957102090a75)
- **VerificationService V2**: [`0xFA88cd14F09c7a78C37048cA118C3568c9324768`](https://sepolia.etherscan.io/address/0xFA88cd14F09c7a78C37048cA118C3568c9324768)

---

## 🔄 V1 vs V2 Modes

PrivyRep supports two operational modes:

| Feature | V1 (Demo Mode) | V2 (Production Mode) |
|---------|----------------|---------------------|
| **Completion Mechanism** | Manual `completeVerification()` | Automatic Oracle callback |
| **Requires Zama Relayer** | ❌ No | ✅ Yes |
| **Requires oracleService.js** | ✅ Yes | ❌ No |
| **Verification Delay** | 5-30 seconds | 2-10 minutes |
| **Decentralization** | Low (owner-controlled) | High (Oracle-automated) |
| **Use Case** | Demo & Testing | Production |
| **Gas Cost** | Lower | Higher (Oracle callback) |

### Switching Between Modes

```bash
# Switch to V1
echo "VITE_USE_V2=false" > privyrep-frontend/.env

# Switch to V2
echo "VITE_USE_V2=true" > privyrep-frontend/.env

# Restart frontend
npm run dev
```

---

## 📁 Project Structure

```
PrivyRep/
├── README.md                       # This file
├── README_CN.md                    # Chinese version
├── LICENSE                         # MIT License
├── .gitignore                      # Git ignore rules
│
├── privyrep-contracts/             # Smart contracts
│   ├── contracts/
│   │   ├── ReputationScore.sol
│   │   ├── IdentityProofManager.sol
│   │   ├── VerificationService.sol      # V1
│   │   └── VerificationServiceV2.sol    # V2
│   ├── scripts/
│   │   ├── deploy.js                    # Deploy V1
│   │   ├── deployV2.js                  # Deploy V2
│   │   ├── oracleService.js             # V1 Oracle simulation
│   │   └── checkRelayerStatus.js        # Relayer status checker
│   ├── deployments/                     # Deployment records
│   ├── hardhat.config.js
│   └── package.json
│
└── privyrep-frontend/              # React frontend
    ├── src/
    │   ├── components/              # React components
    │   ├── pages/                   # Page components
    │   ├── config/                  # Contract configs
    │   │   ├── contracts.ts         # Version switcher
    │   │   ├── contractsV1.ts       # V1 addresses
    │   │   └── contractsV2.ts       # V2 addresses
    │   ├── services/                # FHE & Web3 services
    │   └── utils/                   # Utilities
    ├── vite.config.ts
    └── package.json
```

---

## 📚 Documentation

For detailed information:
- Check the comprehensive README sections above
- Run `npm run check-relayer` in contracts folder to check Zama Relayer status
- Use environment variable `VITE_USE_V2` to switch between V1/V2 modes
- Refer to [Zama FHEVM Docs](https://docs.zama.ai/fhevm) for FHE concepts

---

## 🎯 How It Works

### 1. Register Encrypted Identity
```solidity
// User data is encrypted client-side using FHE
euint32 encryptedAge = TFHE.asEuint32(age);
euint32 encryptedAssetBalance = TFHE.asEuint32(assetBalance);
// ... stored encrypted on-chain
```

### 2. Request Verification
```solidity
// Define verification criteria
uint32 minAssetBalance = 100;
uint32 minNFTCount = 1;
uint32 minAccountAge = 30;
uint32 minTxCount = 10;

// Submit verification request
verificationService.requestVerification(
    minAssetBalance, minNFTCount, minAccountAge, minTxCount
);
```

### 3. FHE Comparison (On Encrypted Data!)
```solidity
// All comparisons happen on encrypted data
ebool assetPass = TFHE.le(minAssetBalance, userAssetBalance);
ebool nftPass = TFHE.le(minNFTCount, userNFTCount);
// ... no data is revealed!
```

### 4. Oracle Callback (V2 Mode)
```solidity
// Zama Oracle decrypts results and calls back
function verificationCallback(uint256 requestId, bool[] memory results)
    public onlyOracle {
    // Update reputation based on encrypted verification
    reputationScore.addScore(user, 10);
}
```

---

## 🧪 Testing

### Check Relayer Status
```bash
cd privyrep-contracts
npm run check-relayer
```

### Run Contract Tests (Coming Soon)
```bash
cd privyrep-contracts
npx hardhat test
```

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

**Manual Deployment:**

```bash
cd privyrep-frontend
npm run build
# Upload dist/ folder to Vercel
```

**Environment Variables on Vercel:**
- `VITE_USE_V2`: `false` (or `true` if Relayer is stable)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Zama](https://www.zama.ai/)** - For the incredible FHEVM technology
- **[Zama Developer Program](https://www.zama.ai/developer-program)** - For supporting this project
- **[OpenZeppelin](https://www.openzeppelin.com/)** - For secure contract standards

---

## 📞 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/huaguihai/PrivyRep/issues)
- **Zama Discord**: [Join the community](https://discord.gg/zama)

---

## ⚠️ Important Notes

- This project is submitted for **Zama Developer Program - Builder Track**
- Requires **Node.js 20+** as per Zama requirements
- Deployed on **Sepolia Testnet** - not production-ready
- V2 functionality depends on Zama Relayer availability
- Use V1 mode for reliable demo experience

---

<a id="chinese"></a>

# PrivyRep - 隐私优先的身份与声誉系统

[查看完整中文文档 →](README_CN.md)

---

**Built with ❤️ using Zama FHEVM**

**Submitted for Zama Developer Program - Builder Track**
