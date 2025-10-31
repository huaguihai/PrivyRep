import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { Clock, CheckCircle, XCircle, History, AlertCircle, RefreshCw } from 'lucide-react';
import { contracts } from '../config/contracts';
import { formatDistanceToNow } from 'date-fns';

interface VerificationRecord {
  taskId: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  passed?: boolean;
  txHash?: string;
}

export function VerificationHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Read verification count
  const { data: verificationCount } = useReadContract({
    address: contracts.verificationService.address,
    abi: contracts.verificationService.abi,
    functionName: 'getUserVerificationCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch verification history from events
  const fetchHistory = useCallback(async () => {
    if (!address || !publicClient) return;

    setLoading(true);
    try {
      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();

      // For Sepolia, the contract was deployed around block 9500000
      const deploymentBlock = 9500000n;

      // Free tier RPC only supports max 10000 blocks per query
      // So we'll fetch in chunks if needed
      const CHUNK_SIZE = 9999n; // Slightly less than 10000 to be safe

      console.log('Fetching verification history from block:', deploymentBlock.toString(), 'to', currentBlock.toString());
      console.log('User address:', address);
      console.log('Contract address:', contracts.verificationService.address);

      // Calculate number of chunks needed
      const totalBlocks = currentBlock - deploymentBlock;
      const numChunks = Math.ceil(Number(totalBlocks) / Number(CHUNK_SIZE));

      console.log(`Total blocks: ${totalBlocks}, will fetch in ${numChunks} chunk(s)`);

      // Fetch all chunks for VerificationRequested events
      let allRequestedLogs: any[] = [];
      for (let i = 0; i < numChunks; i++) {
        const fromBlock = deploymentBlock + BigInt(i) * CHUNK_SIZE;
        const toBlock = i === numChunks - 1 ? currentBlock : fromBlock + CHUNK_SIZE - 1n;

        console.log(`Fetching chunk ${i + 1}/${numChunks}: blocks ${fromBlock} to ${toBlock}`);

        const logs = await publicClient.getLogs({
          address: contracts.verificationService.address,
          event: {
            type: 'event',
            name: 'VerificationRequested',
            inputs: [
              { indexed: true, name: 'taskId', type: 'uint256' },
              { indexed: true, name: 'user', type: 'address' }
            ]
          },
          args: { user: address },
          fromBlock,
          toBlock,
        });

        allRequestedLogs = [...allRequestedLogs, ...logs];
      }

      console.log('VerificationRequested events found:', allRequestedLogs.length);

      // Fetch all chunks for VerificationCompleted events
      let allCompletedLogs: any[] = [];
      for (let i = 0; i < numChunks; i++) {
        const fromBlock = deploymentBlock + BigInt(i) * CHUNK_SIZE;
        const toBlock = i === numChunks - 1 ? currentBlock : fromBlock + CHUNK_SIZE - 1n;

        const logs = await publicClient.getLogs({
          address: contracts.verificationService.address,
          event: {
            type: 'event',
            name: 'VerificationCompleted',
            inputs: [
              { indexed: true, name: 'taskId', type: 'uint256' },
              { indexed: true, name: 'user', type: 'address' },
              { indexed: false, name: 'passed', type: 'bool' }
            ]
          },
          args: { user: address },
          fromBlock,
          toBlock,
        });

        allCompletedLogs = [...allCompletedLogs, ...logs];
      }

      console.log('VerificationCompleted events found:', allCompletedLogs.length);

      // Build records map
      const recordsMap = new Map<number, VerificationRecord>();

      // Process requested events
      for (const log of allRequestedLogs) {
        const taskId = Number((log as any).args.taskId);
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

        recordsMap.set(taskId, {
          taskId,
          timestamp: Number(block.timestamp),
          status: 'pending',
          txHash: log.transactionHash,
        });
      }

      // Process completed events
      for (const log of allCompletedLogs) {
        const taskId = Number((log as any).args.taskId);
        const passed = (log as any).args.passed;
        const existing = recordsMap.get(taskId);

        if (existing) {
          recordsMap.set(taskId, {
            ...existing,
            status: 'completed',
            passed,
          });
        }
      }

      // Convert to array and sort by timestamp (newest first)
      const recordsArray = Array.from(recordsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      setRecords(recordsArray);
    } catch (error) {
      console.error('Error fetching verification history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [address, publicClient]);

  // Initial load
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verification History</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800">Please connect your wallet to view verification history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-md">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification History</h2>
            <p className="text-sm text-gray-600">
              {verificationCount !== undefined && verificationCount !== null
                ? `Total completed: ${verificationCount.toString()}`
                : 'Loading...'
              }
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading verification history...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verification History</h3>
          <p className="text-gray-600">You haven't submitted any verification requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.taskId}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Status Icon */}
                  <div className={`p-3 rounded-lg ${
                    record.status === 'pending'
                      ? 'bg-blue-100'
                      : record.passed
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {record.status === 'pending' ? (
                      <Clock className={`w-6 h-6 text-blue-600 animate-pulse`} />
                    ) : record.passed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  {/* Task Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Task #{record.taskId}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'pending'
                          ? 'bg-blue-100 text-blue-800'
                          : record.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'pending' && 'Pending Oracle Callback'}
                        {record.status === 'completed' && record.passed && 'Verification Passed ✓'}
                        {record.status === 'completed' && !record.passed && 'Verification Failed ✗'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Submitted:</span>{' '}
                        {formatDistanceToNow(record.timestamp * 1000, { addSuffix: true })}
                      </p>
                      {record.txHash && (
                        <p>
                          <span className="font-medium">Transaction:</span>{' '}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${record.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-mono"
                          >
                            {record.txHash.slice(0, 10)}...{record.txHash.slice(-8)}
                          </a>
                        </p>
                      )}
                      {record.status === 'pending' && (
                        <p className="text-blue-600 font-medium mt-2">
                          ⏳ Waiting for Oracle callback (typically 2-10 minutes)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">About Verification Process</p>
            <p>
              After submitting a verification request, the Zama Oracle will process it within 2-10 minutes.
              Once completed, your reputation score will be automatically updated if you pass the verification criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
