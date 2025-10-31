import { useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle, Eye, Database, Award } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PrivyRep</h1>
                <p className="text-xs text-gray-600">Privacy Identity & Reputation</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Hero Icon - Shield + Lock combination */}
            <div className="relative inline-block mb-8">
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-full">
                <Shield className="w-20 h-20 text-cyan-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Privacy-First Identity
              <br />
              <span className="text-cyan-400">Reputation System</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Decentralized privacy identity verification platform powered by Zama FHEVM.
              Prove your identity without revealing your data.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/app')}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Get Started</span>
              </button>
              <a
                href="#features"
                className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border-2 border-blue-600"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose PrivyRep?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built on fully homomorphic encryption technology to protect your sensitive data
              while enabling trustless verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Encrypted Identity */}
            <div className="group bg-white border-2 border-blue-100 rounded-xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="bg-blue-100 group-hover:bg-cyan-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6 transition-colors duration-300">
                <Lock className="w-8 h-8 text-blue-600 group-hover:text-cyan-600 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Encrypted Identity
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your identity data is encrypted using Fully Homomorphic Encryption (FHE).
                Sensitive information remains encrypted on-chain, ensuring complete privacy.
              </p>
            </div>

            {/* Feature 2: Reputation System */}
            <div className="group bg-white border-2 border-blue-100 rounded-xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="bg-blue-100 group-hover:bg-amber-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6 transition-colors duration-300">
                <Award className="w-8 h-8 text-blue-600 group-hover:text-amber-600 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                On-Chain Reputation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Build verifiable reputation scores through encrypted identity verification.
                Your reputation is public, but your data remains private.
              </p>
            </div>

            {/* Feature 3: Zero-Knowledge Verification */}
            <div className="group bg-white border-2 border-blue-100 rounded-xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="bg-blue-100 group-hover:bg-cyan-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6 transition-colors duration-300">
                <Eye className="w-8 h-8 text-blue-600 group-hover:text-cyan-600 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Privacy Verification
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Prove your identity meets criteria without revealing actual values.
                Verifiers only see pass/fail results, never your raw data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to build your privacy-preserving reputation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Register Identity
              </h3>
              <p className="text-gray-600">
                Submit your identity data (assets, NFTs, account age, transactions).
                All data is encrypted with FHE before being stored on-chain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="bg-cyan-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Request Verification
              </h3>
              <p className="text-gray-600">
                Set verification criteria and submit a request. Smart contracts compare
                your encrypted data without decrypting it.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="bg-amber-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Build Reputation
              </h3>
              <p className="text-gray-600">
                Earn reputation points for successful verifications. Your score is public
                and verifiable, while your data stays encrypted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-2xl p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-6 h-6 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">Powered by Zama FHEVM</span>
                </div>
                <h2 className="text-3xl font-bold mb-6">
                  Fully Homomorphic Encryption
                </h2>
                <p className="text-blue-100 text-lg mb-6">
                  PrivyRep leverages Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine)
                  to perform computations on encrypted data without ever decrypting it.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                    <span>Data remains encrypted end-to-end on the blockchain</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                    <span>Smart contracts can compute on encrypted values</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                    <span>Zero-knowledge proofs without trusted setups</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                    <span>Verifiable on-chain without compromising privacy</span>
                  </li>
                </ul>
              </div>
              <div className="hidden md:block">
                <div className="bg-blue-800 bg-opacity-50 rounded-xl p-8 border-2 border-blue-600">
                  <Shield className="w-full h-64 text-blue-300 opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Build Your
            <br />
            <span className="text-blue-600">Privacy-First Reputation?</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join the future of decentralized identity and reputation systems.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center space-x-2"
          >
            <Shield className="w-6 h-6" />
            <span>Launch Application</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-1.5 rounded">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">PrivyRep</span>
              </div>
              <p className="text-sm">
                Privacy-first identity and reputation system built on Zama FHEVM.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-sm">
                <li>Zama FHEVM</li>
                <li>Fully Homomorphic Encryption</li>
                <li>Sepolia Testnet</li>
                <li>Smart Contracts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://docs.zama.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Zama Documentation
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 PrivyRep. Built with privacy in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
