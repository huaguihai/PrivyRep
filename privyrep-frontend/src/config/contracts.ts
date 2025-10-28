import ReputationScoreABI from '../contracts/ReputationScore.json';
import IdentityProofManagerABI from '../contracts/IdentityProofManager.json';
import VerificationServiceABI from '../contracts/VerificationService.json';

export const REPUTATION_SCORE_ADDRESS = import.meta.env.VITE_REPUTATION_SCORE_ADDRESS as `0x${string}`;
export const IDENTITY_PROOF_MANAGER_ADDRESS = import.meta.env.VITE_IDENTITY_PROOF_MANAGER_ADDRESS as `0x${string}`;
export const VERIFICATION_SERVICE_ADDRESS = import.meta.env.VITE_VERIFICATION_SERVICE_ADDRESS as `0x${string}`;

export const contracts = {
  reputationScore: {
    address: REPUTATION_SCORE_ADDRESS,
    abi: ReputationScoreABI.abi,
  },
  identityProofManager: {
    address: IDENTITY_PROOF_MANAGER_ADDRESS,
    abi: IdentityProofManagerABI.abi,
  },
  verificationService: {
    address: VERIFICATION_SERVICE_ADDRESS,
    abi: VerificationServiceABI.abi,
  },
} as const;
