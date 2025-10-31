# PrivyRep Frontend

React-based frontend for the PrivyRep privacy-first identity and reputation system, built with Zama FHEVM integration.

## 🛠️ Tech Stack

- **React** 19.1.1 with TypeScript
- **Vite** 6.3.5 - Lightning-fast build tool
- **Wagmi** 2.15.6 - React Hooks for Ethereum
- **RainbowKit** 2.2.8 - Beautiful wallet connection UI
- **TailwindCSS** 4.1.16 - Utility-first CSS framework
- **Zama Relayer SDK** 0.2.0 - FHE encryption client library
- **Lucide React** - Modern icon library

## 📦 Installation

```bash
npm install
# or
pnpm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (or copy from `.env.example`):

```env
# Contract Version Selection
VITE_USE_V2=false  # Use V1 mode by default
```

- `VITE_USE_V2=false`: Use V1 mode (manual completion with Oracle simulation)
- `VITE_USE_V2=true`: Use V2 mode (automatic Oracle callback - requires Zama Relayer online)

### Check Relayer Status

Before using V2 mode, check if Zama Relayer is online:

```bash
cd ../privyrep-contracts
npm run check-relayer
```

## 🚀 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### V1 Mode (Recommended)

```bash
# Terminal 1: Start Oracle simulation (in contracts folder)
cd ../privyrep-contracts
npm run oracle

# Terminal 2: Start frontend
npm run dev
```

### V2 Mode (Requires Relayer)

```bash
# Ensure Relayer is online, then:
echo "VITE_USE_V2=true" > .env
npm run dev
```

## 🏗️ Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## 👀 Preview Production Build

```bash
npm run preview
```

## 🧹 Lint

```bash
npm run lint
```

## 📂 Project Structure

```
src/
├── assets/              # Static assets
├── components/          # React components
│   ├── ConnectButton.tsx
│   ├── IdentityRegistration.tsx
│   ├── ReputationDisplay.tsx
│   ├── VerificationForm.tsx
│   └── VerificationHistory.tsx
├── config/              # Contract configurations
│   ├── contracts.ts     # Version switcher
│   ├── contractsV1.ts   # V1 contract addresses
│   └── contractsV2.ts   # V2 contract addresses
├── contracts/           # Contract ABIs
├── pages/               # Page components
│   ├── Home.tsx
│   ├── Identity.tsx
│   ├── Reputation.tsx
│   └── Verification.tsx
├── services/            # Services
│   └── fheService.ts    # FHE encryption service
├── utils/               # Utility functions
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── wagmi.ts             # Wagmi configuration
```

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to Vercel

3. Set environment variable on Vercel:
   - `VITE_USE_V2`: `false` (or `true` if Relayer is stable)

## 🔧 Key Features

### FHE Encryption
All identity data is encrypted client-side using Zama's FHE SDK before being sent to the blockchain.

### Multi-Wallet Support
Powered by RainbowKit, supports MetaMask, WalletConnect, Coinbase Wallet, and more.

### Responsive Design
Beautiful, Apple-inspired UI that works seamlessly on desktop and mobile.

### Real-time Updates
Live monitoring of verification requests and reputation score changes.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔗 Links

- [Main README](../README.md) - Project overview and comprehensive documentation
- [Contract Documentation](../privyrep-contracts/README.md) - Smart contracts and deployment

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details
