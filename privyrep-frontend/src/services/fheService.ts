// Polyfill for global (needed in browser environment)
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = globalThis;
}

import { utils } from 'ethers';

// NOTE: We dynamically import the SDK from the CDN to bypass local bundling issues
// and ensure we are using the exact 0.2.0 browser bundle (following Zamabelief's pattern)

// Type definitions
export interface FhevmInstance {
  getPublicKey: () => any;
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  publicDecrypt?: (handles: string[]) => Promise<Record<string, number>>;
}

// Singleton instance management
let fheInstance: FhevmInstance | null = null;
let isInitializing = false;

/**
 * Initialize FHE instance using Zamabelief's proven CDN pattern
 * Uses CDN-hosted SDK to avoid WASM bundling issues
 */
export async function initializeFheInstance(): Promise<FhevmInstance> {
  console.log('🔧 [FHE] Initializing FHE instance...');

  try {
    // 1️⃣ Check browser environment
    if (typeof window === 'undefined') {
      throw new Error("❌ FHE can only be initialized in browser environment");
    }

    // 2️⃣ Check ethereum provider availability
    if (!window.ethereum) {
      throw new Error("❌ Ethereum provider not found. Please install MetaMask or another Web3 wallet.");
    }

    console.log('✅ [FHE] Environment checks passed');

    // 3️⃣ Load SDK from CDN (0.1.0) - Match contract Oracle version!
    console.log('📦 [FHE] Loading SDK from Zama CDN (v0.1.0)...');
    const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.1.0/relayer-sdk-js.js');
    const { initSDK, createInstance, SepoliaConfig } = sdk;
    console.log('✅ [FHE] SDK v0.1.0 loaded from CDN');

    // 4️⃣ Initialize WASM modules
    console.log('📦 [FHE] Loading WASM modules...');
    await initSDK();
    console.log('✅ [FHE] WASM modules loaded');

    // 5️⃣ Create instance with SepoliaConfig
    console.log('⚙️ [FHE] Creating FHEVM instance with SepoliaConfig...');
    const config = { ...SepoliaConfig, network: window.ethereum };
    console.log('🔑 [FHE] Configuration:', {
      hasSepoliaConfig: !!SepoliaConfig,
      hasNetwork: !!window.ethereum,
    });

    const instance = await createInstance(config);
    console.log('✅ [FHE] FHEVM instance created successfully!');
    console.log('📊 [FHE] Instance details:', {
      hasPublicKey: typeof instance.getPublicKey === 'function',
      hasCreateEncryptedInput: typeof instance.createEncryptedInput === 'function',
    });

    return instance;

  } catch (error: any) {
    console.error('❌ [FHE] FHEVM instance creation failed');
    console.error('📛 [FHE] Error type:', error?.constructor?.name || 'Unknown');
    console.error('📛 [FHE] Error message:', error?.message || 'No message');
    console.error('📛 [FHE] Error stack:', error?.stack);

    // Enhanced error messages
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('🌐 Gateway connection failed. Please check your network connection and try again.');
    }
    if (error?.message?.includes('WASM')) {
      throw new Error('📦 WASM module loading failed. Please refresh the page and try again.');
    }
    if (error?.message?.includes('ethereum')) {
      throw new Error('🦊 Web3 wallet not detected. Please install MetaMask or connect your wallet.');
    }

    throw error;
  }
}

/**
 * Gets or creates the FHEVM instance - Singleton pattern
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
  console.log('🔍 [FHE] getFhevmInstance called');

  // Return cached instance if available
  if (fheInstance) {
    console.log('♻️ [FHE] Returning cached instance');
    return fheInstance;
  }

  // Prevent concurrent initialization attempts
  if (isInitializing) {
    console.log('🔒 [FHE] Initialization in progress, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return getFhevmInstance();
  }

  // Create new instance
  isInitializing = true;
  try {
    fheInstance = await initializeFheInstance();
    console.log('🎉 [FHE] Instance cached successfully');
    return fheInstance;
  } catch (error) {
    console.error('💥 [FHE] Instance creation failed, resetting state');
    fheInstance = null;
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Identity data structure for PrivyRep
 */
export interface IdentityData {
  assetBalance: number;  // User's asset balance
  nftCount: number;      // Number of NFTs owned
  accountAge: number;    // Account age in days
  txCount: number;       // Transaction count
}

/**
 * Encrypted identity result matching contract requirements
 */
export interface EncryptedIdentity {
  encryptedAsset: `0x${string}`;
  encryptedNFT: `0x${string}`;
  encryptedAge: `0x${string}`;
  encryptedTx: `0x${string}`;
  inputProof: `0x${string}`;
}

/**
 * Encrypts user identity data using FHE
 * Encrypts all 4 fields required by IdentityProofManager.sol
 */
export async function encryptIdentityData(
  identityData: IdentityData,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedIdentity> {
  console.log('🔐 [FHE] Starting identity encryption process...');
  console.log(`📊 [FHE] Identity data:`, identityData);
  console.log(`📊 [FHE] Contract: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`);
  console.log(`📊 [FHE] User: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);

  try {
    // 1️⃣ Get FHE instance
    console.log('🔧 [FHE] Getting FHE instance...');
    const instance = await getFhevmInstance();
    console.log('✅ [FHE] FHE instance acquired');

    // 2️⃣ Create encrypted input for the specific contract and user
    console.log('📝 [FHE] Creating encrypted input...');
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    console.log('✅ [FHE] Encrypted input created');

    // 3️⃣ Add all 4 identity values as uint32
    console.log(`🔢 [FHE] Adding assetBalance: ${identityData.assetBalance}`);
    input.add32(identityData.assetBalance);

    console.log(`🔢 [FHE] Adding nftCount: ${identityData.nftCount}`);
    input.add32(identityData.nftCount);

    console.log(`🔢 [FHE] Adding accountAge: ${identityData.accountAge}`);
    input.add32(identityData.accountAge);

    console.log(`🔢 [FHE] Adding txCount: ${identityData.txCount}`);
    input.add32(identityData.txCount);

    console.log('✅ [FHE] All identity values added to input');

    // 4️⃣ Generate the encrypted input with proof
    console.log('🔒 [FHE] Encrypting and generating proof...');
    const encryptedInput = await input.encrypt();
    console.log('✅ [FHE] Encryption complete!');

    // ⭐ 关键修复：使用 ethers.utils.hexlify 而不是自定义函数（参考 Zamabelief）
    const handles = encryptedInput.handles.map((h: any) => utils.hexlify(h) as `0x${string}`);
    const inputProof = utils.hexlify(encryptedInput.inputProof) as `0x${string}`;

    console.log('📦 [FHE] Encrypted data:', {
      handleCount: handles.length,
      hasInputProof: !!inputProof,
      handle0Preview: `${handles[0].slice(0, 10)}...`,
      proofPreview: `${inputProof.slice(0, 10)}...`,
    });

    // Verify we have exactly 4 handles
    if (handles.length !== 4) {
      throw new Error(`Expected 4 encrypted handles, got ${handles.length}`);
    }

    const result: EncryptedIdentity = {
      encryptedAsset: handles[0],
      encryptedNFT: handles[1],
      encryptedAge: handles[2],
      encryptedTx: handles[3],
      inputProof: inputProof,
    };

    console.log('🎉 [FHE] Identity encryption successful!');
    return result;

  } catch (error: any) {
    console.error('❌ [FHE] Identity encryption failed');
    console.error('📛 [FHE] Error type:', error?.constructor?.name || 'Unknown');
    console.error('📛 [FHE] Error message:', error?.message || 'No message');
    console.error('📛 [FHE] Full error:', error);

    // Enhanced error messages
    if (error?.message?.includes('createEncryptedInput')) {
      throw new Error('🔧 Failed to create encrypted input. Please check contract and user addresses.');
    }
    if (error?.message?.includes('encrypt')) {
      throw new Error('🔒 Encryption failed. Please try again.');
    }

    throw new Error(`💥 Encryption error: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Helper to get the FHE public key
 */
export async function getFhePublicKey(): Promise<string> {
  console.log('🔑 [FHE] Fetching public key...');
  try {
    const instance = await getFhevmInstance();
    const publicKeyData = instance.getPublicKey();

    // Handle both string and object return types
    let publicKeyHex: string;
    if (typeof publicKeyData === 'string') {
      publicKeyHex = publicKeyData;
    } else if (publicKeyData && 'publicKey' in publicKeyData) {
      publicKeyHex = utils.hexlify(publicKeyData.publicKey);
    } else {
      throw new Error('Unexpected public key format');
    }

    console.log('✅ [FHE] Public key retrieved:', `${publicKeyHex.slice(0, 20)}...`);
    return publicKeyHex;
  } catch (error: any) {
    console.error('❌ [FHE] Failed to get public key:', error);
    throw error;
  }
}

/**
 * Reset FHE instance (useful for debugging or chain switches)
 */
export function resetFheInstance(): void {
  console.log('🔄 [FHE] Resetting FHE instance...');
  fheInstance = null;
  isInitializing = false;
  console.log('✅ [FHE] Instance reset complete');
}
