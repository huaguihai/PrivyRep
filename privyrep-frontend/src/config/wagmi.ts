import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// 使用 RainbowKit 的 getDefaultConfig（与 Zamabelief 一致）
export const config = getDefaultConfig({
  appName: 'PrivyRep - Privacy Identity & Reputation',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c78f1a0787f848a9f9c2f5e5c0f8d9e2', // 默认 projectId
  chains: [sepolia],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
