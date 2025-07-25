import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Users, Calendar, MessageCircle, ArrowRight, CheckCircle, LogOut, User, Menu, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
// import { trackEvent, trackAuthEvent } from '../lib/analytics';
import { clearAllCaches } from '../utils/pwa';
import DailyCheckinForm from './DailyCheckinForm';
import DailyInsightsDisplay from './DailyInsightsDisplay';
import WelcomeInsight from './WelcomeInsight';

const sliderThumbStyle = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FF6F61;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FF6F61;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: none;
  }
`;

const NovaraLanding = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [isClearingCache, setIsClearingCache] = useState(false);
  
  // Load DM Sans font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.body.style.fontFamily = "'DM Sans', sans-serif";

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = sliderThumbStyle;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    // Inject slider styles globally to avoid JSX parsing issues
    const style = document.createElement('style');
    style.textContent = `
      .slider-gradient {
        appearance: none;
        height: 12px;
        border-radius: 6px;
        outline: none;
        cursor: pointer;
      }
      .slider-gradient::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #FF6F61;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider-gradient::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #FF6F61;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Function to get slider background with gradient based on value (commented out for future use)
  // const getSliderBackground = (value: number, min: number = 1, max: number = 10) => {
  //   const percentage = ((value - min) / (max - min)) * 100;
  //   return `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  // };

  // Mobile-specific state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'checkin' | 'insights' | 'welcome'>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    primary_need: '',
    cycle_stage: '',
    top_concern: '',
    email_opt_in: true,
  });
  // Remove old modal state - now using dedicated page

  // Add at the top of the component, after useState for formData
  // const inspirationalMessages = [
  //   "You are stronger than you think. Every step is progress.",
  //   "You’re not alone—others in the Novara community are walking this path with you.",
  //   "It’s okay to take things one day at a time.",
  //   "Your feelings are valid. Be gentle with yourself.",
  //   "Hope grows in small moments."
  // ];
  // const [inspirationIdx] = useState(() => Math.floor(Math.random() * inspirationalMessages.length)); // Commented out for future use
  // const inspirationalMessage = inspirationalMessages[inspirationIdx]; // Commented out for future use

  // Remove old modal debugging code - now using dedicated page
  // const [feedbackGiven, setFeedbackGiven] = useState<null | 'up' | 'down'>(null); // Commented out for future use

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-novara-cream via-white to-novara-cream flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-novara-coral to-novara-lavender flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading Novara...</p>
        </div>
      </div>
    );
  }

  const handleSignup = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await apiClient.createUser(formData);
      
      if (response.success && response.data) {
        console.log('✅ Onboarding signup successful, about to call micro-insight');
        login(formData.email, response.data.token, response.data.user);
        
                // Track onboarding completion
        // trackEvent('Onboarding', 'completed', 'user_registration');
        // trackAuthEvent('register', true);
        
        // Redirect to welcome insight page immediately
        console.log('🎯 Redirecting to welcome insight page');
        setJustSignedUp(true);
        setShowForm(false);
        setCurrentView('welcome');
      } else {
        alert(`Signup failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiClient.loginUser(loginEmail);
      
      if (response.success && response.data) {
        login(loginEmail, response.data.token, response.data.user);
        setShowLogin(false);
        setLoginEmail('');
        setCurrentView('dashboard');
      } else {
        alert(`Login failed: ${response.error || 'User not found'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckinComplete = () => {
    setCurrentView('insights');
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await clearAllCaches();
      alert('Cache cleared successfully! The app will reload to apply changes.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearingCache(false);
    }
  };



  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-40">
      <div className="grid grid-cols-3 gap-1 p-2">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
            currentView === 'dashboard' 
              ? 'bg-[#FF6F61]/10 text-[#FF6F61]' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Heart className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => setCurrentView('checkin')}
          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
            currentView === 'checkin' 
              ? 'bg-[#FF6F61]/10 text-[#FF6F61]' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <MessageCircle className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Check-in</span>
        </button>
        <button
          onClick={() => setCurrentView('insights')}
          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
            currentView === 'insights' 
              ? 'bg-[#FF6F61]/10 text-[#FF6F61]' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Insights</span>
        </button>
      </div>
    </div>
  );

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="bg-white/95 backdrop-blur-sm border-b border-[#FF6F61]/20 sticky top-0 z-50 safe-area-pt">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
            Novara
          </h1>
        </div>
        
        {isAuthenticated ? (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        ) : (
          <Button
            onClick={() => setShowLogin(true)}
            variant="outline"
            size="sm"
            className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61]/5"
          >
            Log In
          </Button>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && isAuthenticated && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF6F61]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#FF6F61]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.nickname || user?.email?.split('@')[0]}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => {
                logout();
                setShowMobileMenu(false);
                setCurrentView('dashboard');
              }}
              variant="outline"
              size="sm"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={isClearingCache}
              variant="outline"
              size="sm"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isClearingCache ? 'animate-spin' : ''}`} />
              {isClearingCache ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>
        </div>
      )}
    </header>
  );

  // Mobile Dashboard View
  const MobileDashboard = () => (
    <div className="px-4 py-6 pb-24 space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        {justSignedUp ? (
          <>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Welcome to Novara, {user?.nickname || user?.email?.split('@')[0]}! 🌟
            </h2>
            <p className="text-gray-600 mb-6">
              Your journey has officially begun. Let's start with your first daily check-in.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-3">
              Welcome back, {user?.nickname || user?.email?.split('@')[0]}! 👋
            </h2>
            <p className="text-gray-600 mb-6">
              Ready for today's check-in? Share how you're feeling and get personalized insights.
            </p>
          </>
        )}
      </div>

      {/* Daily Insights Display */}
      <DailyInsightsDisplay />

      {/* Quick Action Cards - Mobile Stacked */}
      <div className="space-y-4 max-w-sm mx-auto">
        <button
          onClick={() => setCurrentView('checkin')}
          className="w-full bg-[#FF6F61] text-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-2">Daily Check-in</h3>
              <p className="text-white/90 text-sm">Share how you're feeling and get personalized insights</p>
            </div>
            <ArrowRight className="w-6 h-6 text-white/80 flex-shrink-0 ml-4" />
          </div>
        </button>

        <button
          onClick={() => setCurrentView('insights')}
          className="w-full bg-[#CBA7FF] text-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-2">View Insights</h3>
              <p className="text-white/90 text-sm">See your patterns and personalized recommendations</p>
            </div>
            <ArrowRight className="w-6 h-6 text-white/80 flex-shrink-0 ml-4" />
          </div>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Journey</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6F61]">7</div>
            <div className="text-sm text-gray-600">Days Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#CBA7FF]">85%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">🌟</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
        </div>
      </div>

      {/* Next Steps for New Users */}
      {justSignedUp && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">What happens next?</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6F61]/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#FF6F61]" />
              </div>
              <p className="text-sm text-gray-600">Get personalized insights based on your daily check-ins</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#CBA7FF]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#CBA7FF]" />
              </div>
              <p className="text-sm text-gray-600">Track your journey timeline and milestones</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6F61]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#FF6F61]" />
              </div>
              <p className="text-sm text-gray-600">Access expert guidance when you need it</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile Check-in View
  const MobileCheckinView = () => (
    <div className="pb-24">
      <DailyCheckinForm onComplete={handleCheckinComplete} />
    </div>
  );

  // Mobile Insights View
  const MobileInsightsView = () => (
    <div className="px-4 py-6 pb-24">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Insights</h2>
        <p className="text-gray-600">Based on your recent check-ins</p>
      </div>
      <DailyInsightsDisplay />
      
      {/* Encouragement Card */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            You're doing great, {user?.nickname}!
          </h3>
          <p className="text-gray-600 text-sm">
            Every check-in helps us understand your patterns better and provide more personalized insights.
          </p>
        </div>
      </div>
    </div>
  );

  // Main Render Logic
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFF5F0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Desktop Header - Visible on Desktop */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#FF6F61]/20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                Novara
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowLogin(true)}
                variant="outline"
                size="sm"
                className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61]/5"
              >
                Log In
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section - Responsive */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              You don't have to navigate
              <br />
              <span className="bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                IVF alone
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Novara provides personalized support, insights, and community for every step of your fertility journey. 
              From medication guidance to emotional wellness—we're here for you.
            </p>
            
            {/* Desktop: Side by side buttons, Mobile: Stacked */}
            <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md md:max-w-none mx-auto">
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white px-8 py-3 text-lg"
              >
                Start Your Journey
              </Button>
              <Button 
                onClick={() => setShowLogin(true)}
                variant="outline" 
                className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61]/5 px-8 py-3 text-lg"
              >
                Already have an account?
              </Button>
            </div>
          </div>

          {/* Features Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-[#FF6F61]/20 hover:shadow-lg transition-all duration-300 hover:border-[#FF6F61]/40">
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#FF6F61]/10 flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="w-6 h-6 text-[#FF6F61]" />
                </div>
                <CardTitle className="text-xl">Personalized Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Track your cycle, appointments, and milestones with intelligent insights tailored to your unique journey.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#CBA7FF]/20 hover:shadow-lg transition-all duration-300 hover:border-[#CBA7FF]/40">
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#CBA7FF]/10 flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-6 h-6 text-[#CBA7FF]" />
                </div>
                <CardTitle className="text-xl">Daily Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Share how you're feeling and receive personalized micro-insights that acknowledge your experience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#FF6F61]/20 hover:shadow-lg transition-all duration-300 hover:border-[#FF6F61]/40">
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#FF6F61]/10 flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-[#FF6F61]" />
                </div>
                <CardTitle className="text-xl">Expert Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Access evidence-based information about medications, procedures, and what to expect at each stage.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white/50 border-t border-[#FF6F61]/20 py-8">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-gray-600">
              Built with care for those navigating fertility treatment. 
              <span className="text-[#FF6F61]"> Your journey matters.</span>
            </p>
          </div>
        </footer>

        {/* Login Modal - Responsive */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                    Welcome Back
                  </CardTitle>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-gray-600">
                  Enter your email to continue your journey
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      className="border-[#FF6F61]/30 focus:border-[#FF6F61]"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLogin(false)}
                      className="flex-1 border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleLogin}
                      disabled={isSubmitting || !loginEmail}
                      className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                    >
                      {isSubmitting ? 'Logging in...' : 'Log In'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Signup Form Modal - Responsive */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                    Welcome to Novara
                  </CardTitle>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-gray-600">
                  Tell us a bit about yourself so we can personalize your experience
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="border-[#FF6F61]/30 focus:border-[#FF6F61]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nickname">What should we call you?</Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="Your preferred name"
                        className="border-[#FF6F61]/30 focus:border-[#FF6F61]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cycle_stage">Where are you in your journey?</Label>
                    <Select onValueChange={(value) => handleInputChange('cycle_stage', value)}>
                      <SelectTrigger className="border-[#FF6F61]/30 focus:border-[#FF6F61]">
                        <SelectValue placeholder="Select your current stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="considering">Just considering IVF</SelectItem>
                        <SelectItem value="ivf_prep">Preparing for IVF</SelectItem>
                        <SelectItem value="stimulation">In stimulation phase</SelectItem>
                        <SelectItem value="retrieval">Around retrieval</SelectItem>
                        <SelectItem value="transfer">Transfer stage</SelectItem>
                        <SelectItem value="tww">Two-week wait</SelectItem>
                        <SelectItem value="pregnant">Pregnant</SelectItem>
                        <SelectItem value="between_cycles">Between cycles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="primary_need">What would be most helpful right now?</Label>
                    <Select onValueChange={(value) => handleInputChange('primary_need', value)}>
                      <SelectTrigger className="border-[#FF6F61]/30 focus:border-[#FF6F61]">
                        <SelectValue placeholder="Choose your primary need" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emotional_support">Emotional support</SelectItem>
                        <SelectItem value="medication_guidance">Medication guidance</SelectItem>
                        <SelectItem value="financial_planning">Financial planning</SelectItem>
                        <SelectItem value="procedure_info">Procedure information</SelectItem>
                        <SelectItem value="community">Community connection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="confidence_meds">
                      When you think about your IVF medications, do you feel prepared or a bit lost? ({formData.confidence_meds}/10)
                    </Label>
                    <div className="mt-4 px-2">
                                              <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.confidence_meds}
                          onChange={(e) => handleInputChange('confidence_meds', parseInt(e.target.value))}
                          className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
                          style={{
                            background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_meds - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_meds - 1) / 9) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>Very lost</span>
                        <span>Totally prepared</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confidence_costs">
                      When it comes to costs and insurance, do you feel on top of things or a bit in the dark? ({formData.confidence_costs}/10)
                    </Label>
                    <div className="mt-4 px-2">
                                              <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.confidence_costs}
                          onChange={(e) => handleInputChange('confidence_costs', parseInt(e.target.value))}
                          className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
                          style={{
                            background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_costs - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_costs - 1) / 9) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>In the dark</span>
                        <span>On top of it</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confidence_overall">
                      When you look at the road ahead, do you feel steady or shaky? ({formData.confidence_overall}/10)
                    </Label>
                    <div className="mt-4 px-2">
                                              <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.confidence_overall}
                          onChange={(e) => handleInputChange('confidence_overall', parseInt(e.target.value))}
                          className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
                          style={{
                            background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_overall - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_overall - 1) / 9) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>Very shaky</span>
                        <span>Steady</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="top_concern">What's your biggest concern right now? (Optional)</Label>
                    <Textarea
                      id="top_concern"
                      value={formData.top_concern}
                      onChange={(e) => handleInputChange('top_concern', e.target.value)}
                      placeholder="Share what's on your mind..."
                      className="border-[#FF6F61]/30 focus:border-[#FF6F61] resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start space-x-4 p-5 bg-[#FFF5F0]/50 rounded-xl border border-[#FF6F61]/20">
                    <div className="relative flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        id="email_opt_in"
                        checked={formData.email_opt_in}
                        onChange={(e) => handleInputChange('email_opt_in', e.target.checked)}
                        className="sr-only"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('email_opt_in', !formData.email_opt_in)}
                        className={`w-8 h-8 rounded-lg border-3 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FF6F61] focus:ring-offset-2 ${
                          formData.email_opt_in 
                            ? 'bg-[#FF6F61] border-[#FF6F61] text-white shadow-md transform scale-105' 
                            : 'bg-white border-gray-400 hover:border-[#FF6F61] hover:bg-gray-50'
                        }`}
                        aria-checked={formData.email_opt_in}
                        role="checkbox"
                      >
                        {formData.email_opt_in ? (
                          <svg className="w-5 h-5 font-bold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </button>
                    </div>
                    <Label htmlFor="email_opt_in" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none" onClick={() => handleInputChange('email_opt_in', !formData.email_opt_in)}>
                      I'd like to receive supportive emails and updates about my IVF journey. You can unsubscribe anytime.
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1 border-gray-300"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSignup}
                      disabled={isSubmitting || !formData.email}
                      className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                    >
                      {isSubmitting ? 'Joining...' : 'Start My Journey'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Old modal code removed - now using dedicated WelcomeInsight page */}
      </div>
    );
  }

  // Authenticated User Views - Responsive Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFF5F0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Mobile Header - Only show on mobile */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* Desktop Header - Only show on desktop */}
      <div className="hidden md:block">
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#FF6F61]/20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                Novara
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Hi, {user?.nickname || user?.email?.split('@')[0]}!</span>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </header>
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        {currentView === 'welcome' && <WelcomeInsight onContinue={() => setCurrentView('dashboard')} />}
        {currentView !== 'welcome' && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            {justSignedUp ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Welcome to Novara, {user?.nickname || user?.email?.split('@')[0]}! 🌟
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your journey has officially begun. Let's start with your first daily check-in to help us understand how you're feeling today.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4">
                  Welcome back, {user?.nickname || user?.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Ready for today's check-in? Share how you're feeling and get personalized insights.
                </p>
              </>
            )}
          </div>
          
          {/* Desktop Daily Insights Display */}
          <div className="flex justify-center mb-6">
            <DailyInsightsDisplay />
          </div>
          
          {/* Desktop Daily Check-in Form */}
          <div className="flex justify-center">
            <DailyCheckinForm />
          </div>
        </section>
        )}
      </div>

      {/* Mobile Content */}
      <div className="block md:hidden">
        {currentView === 'welcome' && <WelcomeInsight onContinue={() => setCurrentView('dashboard')} />}
        {currentView === 'dashboard' && <MobileDashboard />}
        {currentView === 'checkin' && <MobileCheckinView />}
        {currentView === 'insights' && <MobileInsightsView />}
        
        {currentView !== 'welcome' && <MobileNavigation />}
      </div>
    </div>
  );
};

export default NovaraLanding;