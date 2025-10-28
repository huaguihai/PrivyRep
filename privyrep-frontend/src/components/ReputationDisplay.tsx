import { useAccount, useReadContract } from 'wagmi';
import { contracts } from '../config/contracts';

export function ReputationDisplay() {
  const { address, isConnected } = useAccount();

  // Read user's reputation score
  const { data: score, isLoading, refetch } = useReadContract({
    address: contracts.reputationScore.address,
    abi: contracts.reputationScore.abi,
    functionName: 'getScore',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

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

  // Read registration status
  const { data: isRegistered } = useReadContract({
    address: contracts.identityProofManager.address,
    abi: contracts.identityProofManager.abi,
    functionName: 'hasRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          我的声誉分数
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            请先连接钱包以查看您的声誉分数
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          我的声誉分数
        </h2>
        <button
          onClick={() => refetch()}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          🔄 刷新
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-2">加载中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reputation Score Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
            <p className="text-sm font-medium opacity-90 mb-2">当前声誉分数</p>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold">
                {score !== undefined && score !== null ? score.toString() : '0'}
              </span>
              <span className="text-2xl ml-2 opacity-75">分</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm opacity-90">
                {score !== undefined && Number(score) > 0
                  ? '您已经建立了初步声誉，继续完成验证以提升分数！'
                  : '完成身份验证以开始建立您的链上声誉'}
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">注册状态</p>
              <p className="text-2xl font-bold text-gray-900">
                {isRegistered ? (
                  <span className="text-green-600">✅ 已注册</span>
                ) : (
                  <span className="text-gray-400">❌ 未注册</span>
                )}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">验证次数</p>
              <p className="text-2xl font-bold text-gray-900">
                {verificationCount !== undefined && verificationCount !== null ? verificationCount.toString() : '0'}
              </p>
            </div>
          </div>

          {/* Score Levels Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">声誉等级说明</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center">
                <span className="w-20 font-medium">0-100:</span>
                <span>初级用户 - 刚开始建立声誉</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 font-medium">100-500:</span>
                <span>活跃用户 - 有一定声誉基础</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 font-medium">500+:</span>
                <span>高级用户 - 声誉良好，受信任</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">💡 提升声誉小贴士</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ 完成身份注册 (+10分基础分数)</li>
              <li>✅ 通过身份验证 (+根据验证条件获得额外分数)</li>
              <li>✅ 保持良好的链上行为记录</li>
              <li>✅ 定期更新您的身份信息</li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              您的声誉分数是公开的，但您的身份数据始终保持加密状态
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
