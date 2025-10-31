/**
 * FHE Service - 完全照抄 Zamabelief 的成功实现
 * NOTE: We dynamically import the SDK from the CDN to bypass local bundling issues
 * and ensure we are using the exact 0.2.0 browser bundle.
 */

import { utils } from 'ethers';

// Type definition for FHEVM instance
export interface FhevmInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  getPublicKey: () => any;
  publicDecrypt: (handles: string[]) => Promise<any>;
}

// Singleton instance
let fheInstance: FhevmInstance | null = null;

/**
 * Initialize FHE instance - 完全照抄 Zamabelief
 */
export async function initializeFheInstance(): Promise<FhevmInstance> {
  console.log('🔧 [FHE] Initializing FHE instance...');

  // Check if ethereum is available (prevents mobile crashes)
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask or connect a wallet.');
  }

  // Load SDK from CDN (0.2.0)
  const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');

  const { initSDK, createInstance, SepoliaConfig } = sdk as any;

  await initSDK(); // Loads WASM

  // ⭐ 关键：完全照抄 Zamabelief 的配置，简单就是最好
  const config = { ...SepoliaConfig, network: window.ethereum };

  try {
    fheInstance = await createInstance(config);
    console.log('✅ [FHE] FHEVM instance created successfully!');
    return fheInstance;
  } catch (err) {
    console.error('❌ [FHE] FHEVM instance creation failed:', err);
    throw err;
  }
}

/**
 * Get FHE instance (singleton pattern)
 */
export function getFheInstance(): FhevmInstance | null {
  return fheInstance;
}

/**
 * Get or create FHE instance
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
  if (fheInstance) {
    console.log('♻️ [FHE] Returning cached instance');
    return fheInstance;
  }

  console.log('🆕 [FHE] Creating new instance');
  return await initializeFheInstance();
}

/**
 * Identity data structure for PrivyRep
 */
export interface IdentityData {
  assetBalance: number;
  nftCount: number;
  accountAge: number;
  txCount: number;
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
 * Encrypts user identity data using FHE - 参考 Zamabelief 的实现模式
 */
export async function encryptIdentityData(
  identityData: IdentityData,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedIdentity> {
  console.log('🔐 [FHE] Starting identity encryption...');
  console.log(`📊 [FHE] Data:`, identityData);

  try {
    // 1️⃣ Get or create FHE instance
    let fhe = getFheInstance();
    if (!fhe) {
      console.log('🔧 [FHE] Initializing FHE instance...');
      fhe = await initializeFheInstance();
    }
    if (!fhe) throw new Error('Failed to initialize FHE instance');

    // 2️⃣ Create encrypted input for the specific contract and user
    console.log('📝 [FHE] Creating encrypted input...');
    const ciphertext = await fhe.createEncryptedInput(contractAddress, userAddress);

    // 3️⃣ Add all 4 identity values as uint32
    console.log('🔢 [FHE] Adding identity values...');
    ciphertext.add32(identityData.assetBalance);
    ciphertext.add32(identityData.nftCount);
    ciphertext.add32(identityData.accountAge);
    ciphertext.add32(identityData.txCount);

    // 4️⃣ Encrypt and generate proof
    console.log('🔒 [FHE] Encrypting...');
    const encrypted = await ciphertext.encrypt();
    const { handles, inputProof } = encrypted;

    // 5️⃣ Convert to hex strings using ethers v5 utils.hexlify
    const encryptedHexes = handles.map((h: any) => utils.hexlify(h) as `0x${string}`);
    const proofHex = utils.hexlify(inputProof) as `0x${string}`;

    console.log('✅ [FHE] Encryption complete!');

    // Verify we have exactly 4 handles
    if (encryptedHexes.length !== 4) {
      throw new Error(`Expected 4 encrypted handles, got ${encryptedHexes.length}`);
    }

    return {
      encryptedAsset: encryptedHexes[0],
      encryptedNFT: encryptedHexes[1],
      encryptedAge: encryptedHexes[2],
      encryptedTx: encryptedHexes[3],
      inputProof: proofHex,
    };

  } catch (error: any) {
    console.error('❌ [FHE] Encryption failed:', error);
    throw new Error(`Encryption error: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get FHE public key
 */
export async function getFhePublicKey(): Promise<string> {
  console.log('🔑 [FHE] Fetching public key...');
  try {
    const instance = await getFhevmInstance();
    const publicKeyData = instance.getPublicKey();

    let publicKeyHex: string;
    if (typeof publicKeyData === 'string') {
      publicKeyHex = publicKeyData;
    } else if (publicKeyData && 'publicKey' in publicKeyData) {
      publicKeyHex = publicKeyData.publicKey;
    } else {
      publicKeyHex = JSON.stringify(publicKeyData);
    }

    console.log('✅ [FHE] Public key retrieved, length:', publicKeyHex.length);
    return publicKeyHex;

  } catch (error: any) {
    console.error('❌ [FHE] Failed to get public key:', error);
    throw new Error(`Failed to get FHE public key: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Reset FHE instance (for debugging or chain switches)
 */
export function resetFheInstance() {
  console.log('🔄 [FHE] Resetting instance');
  fheInstance = null;
}

/**
 * Decrypt encrypted value - 参考 Zamabelief
 */
export async function decryptValue(encryptedBytes: string): Promise<number> {
  const fhe = getFheInstance();
  if (!fhe) throw new Error('FHE instance not initialized. Call initializeFheInstance() first.');

  try {
    let handle = encryptedBytes;
    if (typeof handle === "string" && handle.startsWith("0x") && handle.length === 66) {
      const values = await fhe.publicDecrypt([handle]);
      // values is an object: { [handle]: value }
      return Number(values[handle]);
    } else {
      throw new Error('Invalid ciphertext handle for decryption');
    }
  } catch (error: any) {
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Decryption service is temporarily unavailable. Please try again later.');
    }
    throw error;
  }
}
