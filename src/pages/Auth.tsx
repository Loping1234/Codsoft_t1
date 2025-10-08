import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        // Redirect to dashboard on successful auth
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-5xl h-[500px] relative bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Sign In Form */}
        <div className={`absolute inset-0 w-1/2 bg-white flex items-center justify-center transition-all duration-500 ${
          isLogin ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="max-w-sm w-full px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign in</h1>
            
            {/* Social Login Buttons */}
            <div className="flex justify-center space-x-4 mb-4">
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-blue-600 text-xl">f</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-red-500 text-xl">G+</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-blue-700 text-xl">in</span>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">or use your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="text-center">
              <a href="#" className="text-gray-600 text-sm hover:text-gray-800 transition-colors">
                Forgot your password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-8 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 uppercase tracking-wider"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

        {/* Right Side - Sign Up Overlay */}
        <div className={`absolute inset-0 left-1/2 w-1/2 bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white transition-all duration-500 ${
          isLogin ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="text-center px-8">
          <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
          <p className="text-base mb-6 opacity-90">
            Enter your personal details and start journey with us
          </p>
          <button
            onClick={toggleMode}
            className="border-2 border-white text-white py-3 px-8 rounded-full font-semibold hover:bg-white hover:text-pink-500 transition-all transform hover:scale-105 uppercase tracking-wider"
          >
            Sign Up
          </button>
        </div>
      </div>

        {/* Sign Up Form (slides in when toggled) */}
        <div className={`absolute inset-0 left-1/2 w-1/2 bg-white flex items-center justify-center transition-all duration-500 ${
          !isLogin ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}>
        <div className="max-w-sm w-full px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Create Account</h1>
            
            {/* Social Login Buttons */}
            <div className="flex justify-center space-x-4 mb-6">
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-blue-600 text-xl">f</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-red-500 text-xl">G+</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <span className="text-blue-700 text-xl">in</span>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">or use your email for registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Name"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-8 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 uppercase tracking-wider"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>

        {/* Left Side - Sign In Overlay (appears when in sign up mode) */}
        <div className={`absolute inset-0 w-1/2 bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white transition-all duration-500 ${
          !isLogin ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}>
        <div className="text-center px-8">
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg mb-6 opacity-90">
            To keep connected with us please login with your personal info
          </p>
          <button
            onClick={toggleMode}
            className="border-2 border-white text-white py-3 px-8 rounded-full font-semibold hover:bg-white hover:text-pink-500 transition-all transform hover:scale-105 uppercase tracking-wider"
          >
            Sign In
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;