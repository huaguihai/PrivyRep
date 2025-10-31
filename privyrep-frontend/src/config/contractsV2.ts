/**
 * V2 Contract Configuration
 * Uses Zama Oracle callback mechanism
 * Automatically processes verification via Oracle
 * Does NOT require oracleService.js
 */
import ReputationScoreABI from '../contracts/ReputationScore.json';
import IdentityProofManagerABI from '../contracts/IdentityProofManager.json';
import VerificationServiceV2ABI from '../contracts/VerificationServiceV2.json';

export const contractsV2 = {
  reputationScore: {
    address: '0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7' as `0x${string}`,
    abi: ReputationScoreABI.abi,
  },
  identityProofManager: {
    address: '0x75DAd365F12563369aE08688c1b6f105255767b0' as `0x${string}`,
    abi: IdentityProofManagerABI.abi,
  },
  verificationService: {
    address: '0xFA88cd14F09c7a78C37048cA118C3568c9324768' as `0x${string}`,  // V2 address
    abi: VerificationServiceV2ABI.abi,
  },
} as const;
