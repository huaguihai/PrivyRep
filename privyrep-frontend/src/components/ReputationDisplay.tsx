import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Award, RefreshCw, CheckCircle, XCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { contracts } from '../config/contracts';

export function ReputationDisplay() {
  const { address, isConnected } = useAccount();
  const [refreshing, setRefreshing] = useState(false);

  // Read user's complete reputation data
  const { data: reputationData, isLoading, refetch: refetchReputation } = useReadContract({
    address: contracts.reputationScore.address,
    abi: contracts.reputationScore.abi,
    functionName: 'getUserReputationData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Extract score from reputation data
  // getUserReputationData returns: (score, level, lastActivityTime, totalVerifications, totalContributions)
  const score = reputationData ? (reputationData as readonly [bigint, bigint, bigint, bigint, bigint])[0] : undefined;

  // Read verification count
  const { data: verificationCount, refetch: refetchVerificationCount } = useReadContract({
    address: contracts.verificationService.address,
    abi: contracts.verificationService.abi,
    functionName: 'getUserVerificationCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read registration status
  const { data: isRegistered, refetch: refetchRegistration } = useReadContract({
    address: contracts.identityProofManager.address,
    abi: contracts.identityProofManager.abi,
    functionName: 'hasRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchReputation(),
        refetchVerificationCount(),
        refetchRegistration()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            My Reputation Score
          </h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800">
            Please connect your wallet to view your reputation score
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-md">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Reputation</h2>
            <p className="text-sm text-gray-600">Track your on-chain reputation score</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading your reputation...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reputation Score Card */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium opacity-90">Current Reputation Score</p>
              <Award className="w-6 h-6 text-amber-200" />
            </div>
            <div className="flex items-baseline mb-6">
              <span className="text-6xl font-bold">
                {score !== undefined && score !== null ? score.toString() : '0'}
              </span>
              <span className="text-2xl ml-2 opacity-75">points</span>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm opacity-90">
                {score !== undefined && Number(score) > 0
                  ? 'Great! You\'ve started building your reputation. Complete more verifications to increase your score!'
                  : 'Complete identity verification to start building your on-chain reputation'}
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Registration Status</p>
                {isRegistered ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-3xl font-bold">
                {isRegistered ? (
                  <span className="text-green-600">Registered</span>
                ) : (
                  <span className="text-gray-400">Not Registered</span>
                )}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Verifications Completed</p>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {verificationCount !== undefined && verificationCount !== null ? verificationCount.toString() : '0'}
              </p>
            </div>
          </div>

          {/* Reputation Levels Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Reputation Levels</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-24 flex-shrink-0">
                  <span className="inline-block bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">0-100</span>
                </div>
                <span className="text-sm text-blue-800">Beginner - Starting to build reputation</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 flex-shrink-0">
                  <span className="inline-block bg-blue-200 text-blue-700 text-xs font-bold px-2 py-1 rounded">100-500</span>
                </div>
                <span className="text-sm text-blue-800">Active User - Established reputation</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 flex-shrink-0">
                  <span className="inline-block bg-amber-200 text-amber-700 text-xs font-bold px-2 py-1 rounded">500+</span>
                </div>
                <span className="text-sm text-blue-800">Trusted User - High reputation, well trusted</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">How to Improve Your Reputation</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Complete identity registration (+10 base points)</span>
              </li>
              <li className="flex items-start text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Pass identity verification (earn additional points based on criteria)</span>
              </li>
              <li className="flex items-start text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Maintain good on-chain behavior records</span>
              </li>
              <li className="flex items-start text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Regularly update your identity information</span>
              </li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 text-center flex items-center justify-center">
              <Info className="w-4 h-4 mr-2" />
              Your reputation score is public, but your identity data remains encrypted at all times
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
