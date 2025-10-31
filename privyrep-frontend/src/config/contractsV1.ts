/**
 * V1 Contract Configuration
 * Uses manual completion (onlyOwner)
 * Requires oracleService.js running in background
 */
import ReputationScoreABI from '../contracts/ReputationScore.json';
import IdentityProofManagerABI from '../contracts/IdentityProofManager.json';
import VerificationServiceABI from '../contracts/VerificationService.json';

export const contractsV1 = {
  reputationScore: {
    address: '0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7' as `0x${string}`,
    abi: ReputationScoreABI.abi,
  },
  identityProofManager: {
    address: '0x75DAd365F12563369aE08688c1b6f105255767b0' as `0x${string}`,
    abi: IdentityProofManagerABI.abi,
  },
  verificationService: {
    address: '0xe43D69d358a79E92c9dE402303aE957102090a75' as `0x${string}`,
    abi: VerificationServiceABI.abi,
  },
} as const;
