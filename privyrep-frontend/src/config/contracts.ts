/**
 * Smart Contract Configuration
 *
 * Supports V1 and V2 implementations:
 * - V1: Manual completion with oracleService.js (demo mode)
 * - V2: Automatic Oracle callback (production mode)
 *
 * Toggle between versions using VITE_USE_V2 environment variable
 */
import { contractsV1 } from './contractsV1';
import { contractsV2 } from './contractsV2';

// Version selection based on environment variable
const USE_V2 = import.meta.env.VITE_USE_V2 === 'true';

// Export the selected configuration
export const contracts = USE_V2 ? contractsV2 : contractsV1;

// Export version info for debugging
export const contractVersion = USE_V2 ? 'V2' : 'V1';

// Log current version on load
console.log(`🔧 Using contract version: ${contractVersion}`);
console.log(`📍 VerificationService address: ${contracts.verificationService.address}`);
