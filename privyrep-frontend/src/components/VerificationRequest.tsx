import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '../config/contracts';
import toast from 'react-hot-toast';

interface VerificationCriteria {
  minAssetBalance: number;
  minNFTCount: number;
  minAccountAge: number;
  minTxCount: number;
}

export function VerificationRequest() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [criteria, setCriteria] = useState<VerificationCriteria>({
    minAssetBalance: 100,
    minNFTCount: 1,
    minAccountAge: 30,
    minTxCount: 10,
  });

  const handleInputChange = (field: keyof VerificationCriteria, value: string) => {
    const numValue = parseInt(value) || 0;
    setCriteria(prev => ({ ...prev, [field]: numValue }));
  };

  const handleRequestVerification = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包');
      return;
    }

    // Validate inputs
    if (criteria.minAssetBalance < 0 || criteria.minNFTCount < 0 ||
        criteria.minAccountAge < 0 || criteria.minTxCount < 0) {
      toast.error('所有验证条件必须大于等于0');
      return;
    }

    try {
      toast.loading('正在提交验证请求...', { id: 'verify' });

      console.log('📝 Requesting verification with criteria:', criteria);

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
        gas: 3000000n, // ⭐ FHE 合约需要大量 gas，手动设置（参考 Zamabelief）
      });

    } catch (err: any) {
      console.error('❌ Verification request error:', err);
      toast.error(`验证请求失败: ${err.message || '未知错误'}`, { id: 'verify' });
    }
  };

  // ⭐ 使用 useEffect 处理副作用，避免在渲染期间调用 toast
  useEffect(() => {
    if (isSuccess && hash) {
      // 先关闭 loading toast，再显示成功消息
      toast.dismiss('verify');
      toast.success('验证请求已提交！请等待链下处理', { id: hash });
    }
  }, [isSuccess, hash]);

  // Show error if transaction fails
  useEffect(() => {
    if (error) {
      // 关闭 loading toast，显示错误消息
      toast.dismiss('verify');
      toast.error(`交易失败: ${error.message}`, { id: 'tx-error' });
    }
  }, [error]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        身份验证请求
      </h2>

      <p className="text-gray-600 mb-6">
        设置验证条件，系统将使用FHE加密比较您的身份数据
      </p>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            请先连接钱包以请求验证
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">验证流程说明</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>设置您想要达到的验证条件</li>
              <li>提交验证请求到智能合约</li>
              <li>系统使用FHE加密比较您的数据与条件</li>
              <li>如果通过验证，您将获得声誉分数奖励</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最小资产余额 (Min Asset Balance)
            </label>
            <input
              type="number"
              min="0"
              value={criteria.minAssetBalance}
              onChange={(e) => handleInputChange('minAssetBalance', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如: 100"
              disabled={isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              您的资产余额需要 ≥ 此值才能通过验证
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最小 NFT 数量 (Min NFT Count)
            </label>
            <input
              type="number"
              min="0"
              value={criteria.minNFTCount}
              onChange={(e) => handleInputChange('minNFTCount', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如: 1"
              disabled={isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              您的 NFT 数量需要 ≥ 此值才能通过验证
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最小账户年龄 (Min Account Age in Days)
            </label>
            <input
              type="number"
              min="0"
              value={criteria.minAccountAge}
              onChange={(e) => handleInputChange('minAccountAge', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如: 30"
              disabled={isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              您的账户年龄需要 ≥ 此值才能通过验证
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最小交易次数 (Min Transaction Count)
            </label>
            <input
              type="number"
              min="0"
              value={criteria.minTxCount}
              onChange={(e) => handleInputChange('minTxCount', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如: 10"
              disabled={isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              您的交易次数需要 ≥ 此值才能通过验证
            </p>
          </div>

          <button
            onClick={handleRequestVerification}
            disabled={isPending || isConfirming}
            className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isPending && '📝 等待签名...'}
            {!isPending && isConfirming && '⏳ 确认中...'}
            {!isPending && !isConfirming && '✅ 提交验证请求'}
          </button>

          {hash && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">交易哈希:</span>{' '}
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </a>
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">隐私保护</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✅ 所有比较操作在加密状态下进行</li>
              <li>✅ 验证者只能看到"通过"或"不通过"的结果</li>
              <li>✅ 您的具体数据值始终保持加密</li>
              <li>✅ 实现零知识证明式的验证体验</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
