import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
      toast.error('请先连接钱包');
      return;
    }

    // Validate inputs
    if (formData.assetBalance < 0 || formData.nftCount < 0 ||
        formData.accountAge < 0 || formData.txCount < 0) {
      toast.error('所有值必须大于等于0');
      return;
    }

    try {
      setIsEncrypting(true);
      toast.loading('正在加密身份数据...', { id: 'encrypting' });

      // Encrypt identity data using FHE
      console.log('🔐 Starting FHE encryption...');
      const encrypted = await encryptIdentityData(
        formData,
        contracts.identityProofManager.address,
        address
      );

      toast.success('加密完成！正在提交交易...', { id: 'encrypting' });
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
        gas: 3000000n, // ⭐ FHE 合约需要大量 gas，手动设置（参考 Zamabelief）
      });

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      toast.error(`注册失败: ${err.message || '未知错误'}`, { id: 'encrypting' });
    } finally {
      setIsEncrypting(false);
    }
  };

  // ⭐ 使用 useEffect 处理副作用，避免在渲染期间调用 toast
  useEffect(() => {
    if (isSuccess && hash) {
      // 先关闭加密/交易 loading toast，再显示最终成功消息
      toast.dismiss('encrypting');
      toast.success('身份注册成功！', { id: hash });
    }
  }, [isSuccess, hash]);

  // Show error if transaction fails
  useEffect(() => {
    if (error) {
      // 关闭 loading toast，显示错误消息
      toast.dismiss('encrypting');
      toast.error(`交易失败: ${error.message}`, { id: 'tx-error' });
    }
  }, [error]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        注册加密身份
      </h2>

      <p className="text-gray-600 mb-6">
        您的数据将使用全同态加密(FHE)进行加密，确保隐私安全
      </p>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            请先连接钱包以注册身份
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              资产余额 (Asset Balance)
            </label>
            <input
              type="number"
              min="0"
              value={formData.assetBalance}
              onChange={(e) => handleInputChange('assetBalance', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入您的资产余额"
              disabled={isEncrypting || isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              例如: 1000 (将被加密存储)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NFT 数量 (NFT Count)
            </label>
            <input
              type="number"
              min="0"
              value={formData.nftCount}
              onChange={(e) => handleInputChange('nftCount', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入您拥有的NFT数量"
              disabled={isEncrypting || isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              例如: 5 (将被加密存储)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              账户年龄 (Account Age in Days)
            </label>
            <input
              type="number"
              min="0"
              value={formData.accountAge}
              onChange={(e) => handleInputChange('accountAge', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入账户年龄（天数）"
              disabled={isEncrypting || isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              例如: 365 表示账户已存在1年 (将被加密存储)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              交易次数 (Transaction Count)
            </label>
            <input
              type="number"
              min="0"
              value={formData.txCount}
              onChange={(e) => handleInputChange('txCount', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入历史交易次数"
              disabled={isEncrypting || isPending || isConfirming}
            />
            <p className="text-xs text-gray-500 mt-1">
              例如: 100 (将被加密存储)
            </p>
          </div>

          <button
            onClick={handleRegister}
            disabled={isEncrypting || isPending || isConfirming}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isEncrypting && '🔐 正在加密...'}
            {!isEncrypting && isPending && '📝 等待签名...'}
            {!isEncrypting && !isPending && isConfirming && '⏳ 确认中...'}
            {!isEncrypting && !isPending && !isConfirming && '🚀 注册身份'}
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

          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-900 mb-2">隐私保护说明</h3>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>✅ 所有数据使用全同态加密(FHE)加密</li>
              <li>✅ 数据在链上以加密形式存储</li>
              <li>✅ 只有您和授权的智能合约可以处理加密数据</li>
              <li>✅ 其他人无法查看您的原始数据</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
