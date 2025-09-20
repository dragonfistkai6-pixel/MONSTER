import React, { useState } from 'react';
import { Leaf, Eye, EyeOff, LogIn, Loader2, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    organization: '',
    role: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginAsConsumer } = useAuth();

  const roles = [
    { value: '1', label: 'Collector Group' },
    { value: '2', label: 'Testing Labs' },
    { value: '3', label: 'Processing Unit' },
    { value: '4', label: 'Manufacturing Plant' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Handle signup
        await signup(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerAccess = () => {
    loginAsConsumer();
  };

  const signup = async (userData: any) => {
    // Demo signup - in production, this would call backend API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Auto-login after signup
    await login(userData.email, userData.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />
      <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-40 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-4 border border-white/20">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">HerbionYX</h1>
          <p className="text-green-200">Ayurvedic Herb Traceability System</p>
        </div>

        {/* Consumer Access Button */}
        <div className="mb-6">
          <button
            onClick={handleConsumerAccess}
            className="w-full bg-white/10 backdrop-blur-md text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 flex items-center justify-center space-x-2"
          >
            <Shield className="h-5 w-5" />
            <span>Consumer Access (No Login Required)</span>
          </button>
        </div>

        {/* Auth Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-green-800 text-center mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your organization"
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white"
                  >
                    <option value="">Select your role</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value} className="text-black">
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-green-200 hover:text-white text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Demo Credentials */}
          {!isSignUp && (
            <div className="mt-8 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/20">
              <h3 className="font-medium text-white mb-2">Demo Credentials</h3>
              <div className="text-sm text-green-200 space-y-2">
              <div>
                <p><strong>Collector:</strong> collector@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
              <div>
                <p><strong>Tester:</strong> tester@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
              <div>
                <p><strong>Processor:</strong> processor@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
              <div>
                <p><strong>Manufacturer:</strong> manufacturer@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-green-200">
          <p>Demo Mode - No Backend Required</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;