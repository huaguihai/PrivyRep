# PrivyRep Smart Contracts

Smart contracts for the PrivyRep privacy-first identity and reputation system, built on Zama FHEVM.

## 🏗️ Contract Architecture

### Core Contracts

1. **ReputationScore.sol**
   - Manages user reputation scores
   - Authorized access control
   - Score calculation and updates

2. **IdentityProofManager.sol**
   - Stores encrypted identity data using FHE
   - Encrypts: age, asset balance, NFT count, account age, transaction count
   - All data stored as `euint32` (encrypted uint32)

3. **VerificationService.sol (V1)**
   - Manual verification completion
   - Owner-controlled callback
   - Used for demo and testing

4. **VerificationServiceV2.sol (V2)**
   - Automatic Oracle callback via Zama Relayer
   - `FHE.requestDecryption()` integration
   - Production-ready decentralized verification

## 🛠️ Tech Stack

- **Zama FHEVM** 0.8.0 - Fully Homomorphic Encryption
- **Hardhat** 2.25.0 - Development environment
- **OpenZeppelin Contracts** 5.3.0 - Security standards
- **Solidity** ^0.8.24
- **Ethers.js** 6.14.3

## 📦 Installation

```bash
npm install
# or
pnpm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ Never commit `.env` to version control!**

## 🚀 Deployment

### Deploy V1 Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy V2 Contracts

```bash
npx hardhat run scripts/deployV2.js --network sepolia
```

Deployment records are saved in `deployments/` folder.

## 📍 Deployed Contracts (Sepolia)

### Shared Contracts
- **ReputationScore**: `0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7`
- **IdentityProofManager**: `0x75DAd365F12563369aE08688c1b6f105255767b0`

### Version-Specific
- **VerificationService V1**: `0xe43D69d358a79E92c9dE402303aE957102090a75`
- **VerificationService V2**: `0xFA88cd14F09c7a78C37048cA118C3568c9324768`

## 🔧 Utility Scripts

### Check Relayer Status

Check if Zama Relayer is online before using V2:

```bash
npm run check-relayer
```

Output:
- 🟢 OPERATIONAL - Relayer is working, use V2
- 🟡 UNCERTAIN - Status unclear, use V1 as backup
- 🔴 OFFLINE - Relayer is down, use V1

### Start Oracle Simulation (V1 Mode)

Automatically processes verification requests for V1:

```bash
npm run oracle
```

Keep this running in the background when using V1 mode.

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/ReputationScore.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

## 📂 Project Structure

```
privyrep-contracts/
├── contracts/
│   ├── ReputationScore.sol
│   ├── IdentityProofManager.sol
│   ├── VerificationService.sol      # V1
│   └── VerificationServiceV2.sol    # V2
├── scripts/
│   ├── deploy.js                    # Deploy V1
│   ├── deployV2.js                  # Deploy V2
│   ├── oracleService.js             # V1 Oracle simulation
│   └── checkRelayerStatus.js        # Relayer status checker
├── deployments/                     # Deployment records (JSON)
├── test/                            # Contract tests
├── hardhat.config.js                # Hardhat configuration
├── .env.example                     # Environment template
└── package.json
```

## 🔑 Key Features

### FHE Encryption

All sensitive data is encrypted on-chain:

```solidity
// Store encrypted identity data
function registerIdentity(
    bytes calldata encryptedAge,
    bytes calldata encryptedAssetBalance,
    bytes calldata encryptedNFTCount,
    bytes calldata encryptedAccountAge,
    bytes calldata encryptedTxCount
) external {
    identities[msg.sender] = Identity({
        age: TFHE.asEuint32(encryptedAge),
        assetBalance: TFHE.asEuint32(encryptedAssetBalance),
        nftCount: TFHE.asEuint32(encryptedNFTCount),
        accountAge: TFHE.asEuint32(encryptedAccountAge),
        txCount: TFHE.asEuint32(encryptedTxCount),
        isRegistered: true
    });
}
```

### Homomorphic Comparisons

Verify credentials without decryption:

```solidity
// Compare encrypted values (no data revealed!)
ebool assetPass = TFHE.le(minAssetBalance, identity.assetBalance);
ebool nftPass = TFHE.le(minNFTCount, identity.nftCount);
ebool agePass = TFHE.le(minAccountAge, identity.accountAge);
ebool txPass = TFHE.le(minTxCount, identity.txCount);
```

### Oracle Integration (V2)

```solidity
// Request decryption from Oracle
uint256 requestId = FHE.requestDecryption(
    cts,
    this.verificationCallback.selector
);

// Oracle calls back with results
function verificationCallback(
    uint256 requestId,
    bool[] memory decryptedResults
) public onlyOracle {
    // Update reputation based on verification
}
```

## 📜 Available Commands

```bash
# Compilation
npx hardhat compile

# Deployment
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deployV2.js --network sepolia

# Utilities
npm run check-relayer        # Check Zama Relayer status
npm run oracle                # Start V1 Oracle simulation

# Testing
npx hardhat test              # Run tests
npx hardhat coverage          # Generate coverage report

# Verification (Etherscan)
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 🔄 V1 vs V2

| Feature | V1 | V2 |
|---------|----|----|
| **Completion** | Manual `completeVerification()` | Automatic Oracle callback |
| **Owner Role** | Required | Not required after deployment |
| **Relayer Dependency** | No | Yes |
| **Decentralization** | Low | High |
| **Gas Cost** | Lower | Higher (Oracle fees) |
| **Best For** | Demo/Testing | Production |

## 📚 Documentation

- [Main README](../README.md) - Full project documentation with V1/V2 switching guide
- Run `npm run check-relayer` to check Zama Relayer status
- See [Zama FHEVM Docs](https://docs.zama.ai/fhevm) for FHE concepts

## 🔗 External Resources

- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## ⚠️ Security Notes

- Never commit `.env` file
- Use test networks for development
- Audit contracts before mainnet deployment
- Keep private keys secure
- Monitor Oracle reliability for V2

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details
