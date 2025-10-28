/// <reference types="vite/client" />

// Environment variables
interface ImportMetaEnv {
  readonly VITE_REPUTATION_SCORE_ADDRESS: string
  readonly VITE_IDENTITY_PROOF_MANAGER_ADDRESS: string
  readonly VITE_VERIFICATION_SERVICE_ADDRESS: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_CHAIN_NAME: string
  readonly VITE_RPC_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Ethereum provider (MetaMask, etc.)
interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
  }
}

// Global polyfills
declare global {
  var global: typeof globalThis
}
