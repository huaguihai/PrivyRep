import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { IdentityRegistration } from './components/IdentityRegistration'
import { ReputationDisplay } from './components/ReputationDisplay'
import { VerificationRequest } from './components/VerificationRequest'
import './App.css'

type Tab = 'register' | 'reputation' | 'verify'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('reputation')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />

      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">PrivyRep</h1>
              <p className="ml-3 text-sm text-gray-500">Privacy Identity & Reputation</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            隐私身份与声誉系统
          </h2>
          <p className="text-xl text-gray-600">
            基于 FHEVM 的去中心化隐私身份验证平台
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-lg font-semibold mb-2">加密身份</h3>
            <p className="text-gray-600">使用全同态加密保护您的敏感数据</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold mb-2">声誉系统</h3>
            <p className="text-gray-600">建立可信的链上声誉记录</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">隐私验证</h3>
            <p className="text-gray-600">无需泄露数据即可证明身份</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reputation')}
                className={`${
                  activeTab === 'reputation'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                我的声誉
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`${
                  activeTab === 'register'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                注册身份
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                className={`${
                  activeTab === 'verify'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                身份验证
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === 'reputation' && <ReputationDisplay />}
          {activeTab === 'register' && <IdentityRegistration />}
          {activeTab === 'verify' && <VerificationRequest />}
        </div>

        {/* 合约地址信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">合约地址（Sepolia 测试网）</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">ReputationScore:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {import.meta.env.VITE_REPUTATION_SCORE_ADDRESS}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">IdentityProofManager:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {import.meta.env.VITE_IDENTITY_PROOF_MANAGER_ADDRESS}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">VerificationService:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {import.meta.env.VITE_VERIFICATION_SERVICE_ADDRESS}
              </code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
