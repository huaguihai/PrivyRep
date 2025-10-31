import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Award, UserPlus, CheckCircle, Home, History } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ReputationDisplay } from '../components/ReputationDisplay';
import { IdentityRegistration } from '../components/IdentityRegistration';
import { VerificationRequest } from '../components/VerificationRequest';
import { VerificationHistory } from '../components/VerificationHistory';

type View = 'reputation' | 'register' | 'verify' | 'history';

export function DApp() {
  const [activeView, setActiveView] = useState<View>('reputation');
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'reputation' as View,
      label: 'My Reputation',
      icon: Award,
      description: 'View your reputation score'
    },
    {
      id: 'register' as View,
      label: 'Register Identity',
      icon: UserPlus,
      description: 'Register encrypted identity'
    },
    {
      id: 'verify' as View,
      label: 'Verification',
      icon: CheckCircle,
      description: 'Request verification'
    },
    {
      id: 'history' as View,
      label: 'Verification History',
      icon: History,
      description: 'View verification records'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-950 text-white flex-shrink-0 shadow-xl">
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="p-6 border-b border-blue-800">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-blue-700 p-2 rounded-lg shadow-md">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold">PrivyRep</h1>
                <p className="text-xs text-blue-300">DApp</p>
              </div>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-700 text-white border-l-4 border-cyan-400 shadow-lg'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Back to Landing */}
          <div className="p-4 border-t border-blue-800">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center space-x-2 px-4 py-2 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                {navigationItems.find(item => item.id === activeView)?.description}
              </p>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeView === 'reputation' && <ReputationDisplay />}
            {activeView === 'register' && <IdentityRegistration />}
            {activeView === 'verify' && <VerificationRequest />}
            {activeView === 'history' && <VerificationHistory />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>Powered by Zama FHEVM • Sepolia Testnet</p>
            <p>© 2025 PrivyRep</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
