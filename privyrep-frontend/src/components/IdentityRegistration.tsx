import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { UserPlus, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { encryptIdentityData, type IdentityData } from '../services/fheService';
import { contracts } from '../config/contracts';
import toast from 'react-hot-toast';

export function IdentityRegistration() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState<IdentityData>({
    assetBalance: 0,
    nftCount: 0,
    accountAge: 0,
    txCount: 0,
  });

  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleInputChange = (field: keyof IdentityData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleRegister = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate inputs
    if (formData.assetBalance < 0 || formData.nftCount < 0 ||
        formData.accountAge < 0 || formData.txCount < 0) {
      toast.error('All values must be greater than or equal to 0');
      return;
    }

    try {
      setIsEncrypting(true);
      toast.loading('Encrypting identity data with FHE...', { id: 'encrypting' });

      // Encrypt identity data using FHE
      console.log('🔐 Starting FHE encryption...');
      const encrypted = await encryptIdentityData(
        formData,
        contracts.identityProofManager.address,
        address
      );

      toast.success('Encryption complete! Submitting transaction...', { id: 'encrypting' });
      console.log('✅ Encryption complete:', encrypted);

      // Call contract with encrypted data
      console.log('📝 Calling registerIdentity contract method...');
      writeContract({
        address: contracts.identityProofManager.address,
        abi: contracts.identityProofManager.abi,
        functionName: 'registerIdentity',
        args: [
          encrypted.encryptedAsset,
          encrypted.encryptedNFT,
          encrypted.encryptedAge,
          encrypted.encryptedTx,
          encrypted.inputProof,
        ],
        gas: 3000000n, // FHE contracts require significant gas
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(`Registration failed: ${err.message || 'Unknown error'}`, { id: 'encrypting' });
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.dismiss('encrypting');
      toast.success('Identity registered successfully!', { id: hash });
    }
  }, [isSuccess, hash]);

  // Show error if transaction fails
  useEffect(() => {
    if (error) {
      toast.dismiss('encrypting');
      toast.error(`Transaction failed: ${error.message}`, { id: 'tx-error' });
    }
  }, [error]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-md">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Register Encrypted Identity</h2>
          <p className="text-sm text-gray-600">Your data will be encrypted using Fully Homomorphic Encryption (FHE)</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800">
            Please connect your wallet to register your identity
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asset Balance
              </label>
              <input
                type="number"
                min="0"
                value={formData.assetBalance}
                onChange={(e) => handleInputChange('assetBalance', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your asset balance"
                disabled={isEncrypting || isPending || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                e.g., 1000 (will be stored encrypted)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NFT Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.nftCount}
                onChange={(e) => handleInputChange('nftCount', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter number of NFTs you own"
                disabled={isEncrypting || isPending || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                e.g., 5 (will be stored encrypted)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Age (in days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.accountAge}
                onChange={(e) => handleInputChange('accountAge', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter account age in days"
                disabled={isEncrypting || isPending || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                e.g., 365 for 1 year old account (will be stored encrypted)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transaction Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.txCount}
                onChange={(e) => handleInputChange('txCount', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your historical transaction count"
                disabled={isEncrypting || isPending || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                e.g., 100 (will be stored encrypted)
              </p>
            </div>

            <button
              onClick={handleRegister}
              disabled={isEncrypting || isPending || isConfirming}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              {isEncrypting && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Encrypting...</span>
                </>
              )}
              {!isEncrypting && isPending && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Awaiting Signature...</span>
                </>
              )}
              {!isEncrypting && !isPending && isConfirming && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirming...</span>
                </>
              )}
              {!isEncrypting && !isPending && !isConfirming && (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Register Identity</span>
                </>
              )}
            </button>
          </div>

          {/* Transaction Hash */}
          {hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Transaction Hash:</span>{' '}
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 font-mono"
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </a>
              </p>
            </div>
          )}

          {/* Privacy Protection Notice */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Privacy Protection</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>All data is encrypted using Fully Homomorphic Encryption (FHE)</span>
              </li>
              <li className="flex items-start text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Data is stored on-chain in encrypted form</span>
              </li>
              <li className="flex items-start text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Only you and authorized smart contracts can process encrypted data</span>
              </li>
              <li className="flex items-start text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Others cannot view your raw data values</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
