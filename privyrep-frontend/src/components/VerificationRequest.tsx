import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { contracts } from '../config/contracts';
import toast from 'react-hot-toast';

interface VerificationCriteria {
  minAssetBalance: number;
  minNFTCount: number;
  minAccountAge: number;
  minTxCount: number;
}

interface VerificationTask {
  taskId: bigint;
  isCompleted: boolean;
  passed: boolean;
  timestamp: bigint;
}

// SVG Icons
const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function VerificationRequest() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [criteria, setCriteria] = useState<VerificationCriteria>({
    minAssetBalance: 100,
    minNFTCount: 1,
    minAccountAge: 30,
    minTxCount: 10,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Read verification count to track completed verifications
  const { data: verificationCount } = useReadContract({
    address: contracts.verificationService.address,
    abi: contracts.verificationService.abi,
    functionName: 'getUserVerificationCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Note: VerificationRequested events are for monitoring only
  // The Oracle will automatically process verification requests
  // Users should check the Verification History page for results

  // Monitor wallet signature completion
  useEffect(() => {
    if (hash && !isPending) {
      toast.dismiss('verify');
      setShowSuccessMessage(true);
    }
  }, [hash, isPending]);

  useEffect(() => {
    if (error) {
      toast.dismiss('verify');
      toast.error(`请求失败: ${error.message}`, { id: 'tx-error' });
    }
  }, [error]);

  const handleInputChange = (field: keyof VerificationCriteria, value: string) => {
    const numValue = parseInt(value) || 0;
    setCriteria(prev => ({ ...prev, [field]: numValue }));
  };

  const handleRequestVerification = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (criteria.minAssetBalance < 0 || criteria.minNFTCount < 0 ||
        criteria.minAccountAge < 0 || criteria.minTxCount < 0) {
      toast.error('All validation criteria must be greater than or equal to 0');
      return;
    }

    try {
      setShowSuccessMessage(false);
      reset(); // Reset previous transaction state
      toast.loading('Waiting for wallet signature...', { id: 'verify' });

      writeContract({
        address: contracts.verificationService.address,
        abi: contracts.verificationService.abi,
        functionName: 'requestVerification',
        args: [
          criteria.minAssetBalance,
          criteria.minNFTCount,
          criteria.minAccountAge,
          criteria.minTxCount,
        ],
        gas: 3000000n,
      });

    } catch (err: any) {
      console.error('Verification request error:', err);
      toast.error(`Request failed: ${err.message || 'Unknown error'}`, { id: 'verify' });
    }
  };

  // Note: completeVerification can only be called by contract owner (Oracle)
  // Users cannot complete verification themselves - it's handled by the Oracle callback

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-lg shadow-md">
          <ShieldIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification Request</h1>
          <p className="text-gray-600 mt-1">Protect your privacy data with FHE encryption technology</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start space-x-4">
          <AlertIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Wallet Connection Required</h3>
            <p className="text-yellow-800">Please connect your wallet to begin identity verification</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Message */}
          {showSuccessMessage && hash && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg animate-in slide-in-from-top">
              <div className="flex items-start space-x-4">
                <div className="bg-green-500 p-3 rounded-lg flex-shrink-0">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Verification Request Successfully Submitted!
                  </h3>
                  <div className="space-y-2 text-green-800">
                    <p className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Your request has been submitted to the blockchain
                    </p>
                    <p className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Oracle will process your verification within 2-10 minutes
                    </p>
                    <p className="flex items-center">
                      <InfoIcon className="w-4 h-4 mr-2" />
                      Check "Verification History" page to view the status and results
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Transaction Hash:</span>{' '}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-green-900 font-mono"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Criteria Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <InfoIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Set Verification Criteria</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Asset Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={criteria.minAssetBalance}
                  onChange={(e) => handleInputChange('minAssetBalance', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 100"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Your asset balance must be ≥ this value to pass verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum NFT Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={criteria.minNFTCount}
                  onChange={(e) => handleInputChange('minNFTCount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 1"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Your NFT count must be ≥ this value to pass verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Account Age (in Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={criteria.minAccountAge}
                  onChange={(e) => handleInputChange('minAccountAge', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 30"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Your account age must be ≥ this value to pass verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Transaction Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={criteria.minTxCount}
                  onChange={(e) => handleInputChange('minTxCount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 10"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Your transaction count must be ≥ this value to pass verification
                </p>
              </div>

              <button
                onClick={handleRequestVerification}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <ShieldIcon className="w-5 h-5" />
                <span>{isPending ? 'Waiting for wallet signature...' : 'Submit Verification Request'}</span>
              </button>
            </div>
          </div>

          {/* Privacy Protection Notice */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Privacy Protection Mechanism</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>All comparison operations are performed in FHE encrypted state, no one can see your raw data</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Verifiers can only see "pass" or "fail" results, unable to obtain specific values</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Your data always remains encrypted, achieving true zero-knowledge proof</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Based on Zama FHEVM technology, providing verifiable on-chain privacy protection</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
