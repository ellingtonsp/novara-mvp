import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Users, Calendar, MessageCircle, CheckCircle, LogOut, User, Menu, X, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { API_BASE_URL } from '../lib/environment';
// import { trackEvent, trackAuthEvent } from '../lib/analytics';
import { clearAllCaches } from '../utils/pwa';
// DailyCheckinForm import removed - using enhanced forms instead
import { EnhancedDailyCheckinForm } from './EnhancedDailyCheckinForm';
import { QuickDailyCheckinForm } from './QuickDailyCheckinForm';
import { CheckinPreferenceToggle } from './CheckinPreferenceToggle';
import DailyInsightsDisplay from './DailyInsightsDisplay';
import WelcomeInsight from './WelcomeInsight';
import { BaselinePanel } from './BaselinePanel';
import ChecklistCard from './ChecklistCard';
import { OutcomeMetricsDashboard } from './OutcomeMetricsDashboard';
import { TodaysCheckinStatus } from './TodaysCheckinStatus';
// ON-01: A/B Test Integration
import { getOnboardingPath, OnboardingPath, trackOnboardingPathSelected, generateSessionId } from '../utils/abTestUtils';
import { OnboardingFast } from './OnboardingFast';
import { getLocalDateString, logTimezoneDebug } from '../lib/dateUtils';
import { isCheckinToday, debugCheckinDates } from '../lib/checkinMigration';

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
  const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [checkinPreference, setCheckinPreference] = useState<'quick_daily' | 'comprehensive_daily'>('quick_daily');
  const [showWeeklyReminder, setShowWeeklyReminder] = useState(false);
  const [todaysCheckin, setTodaysCheckin] = useState<any>(null);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [isCheckingTodaysCheckin, setIsCheckingTodaysCheckin] = useState(true);
  
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
  
  // ON-01: A/B Test State
  const [onboardingPath, setOnboardingPath] = useState<OnboardingPath | null>(null);
  const [showBaselinePanel, setShowBaselinePanel] = useState(false);
  const [baselineStartTime, setBaselineStartTime] = useState(0);
  const [baselineDismissed, setBaselineDismissed] = useState(false);
  
  // ON-01: Speed-tapper detection state (commented out for future implementation)
  // const [isSpeedTapper, setIsSpeedTapper] = useState(false);
  // const [tapTimes, setTapTimes] = useState<number[]>([]);
  // const [currentStep, setCurrentStep] = useState(1);
  // const [showSimplifiedForm, setShowSimplifiedForm] = useState(false);
  
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
  
  // ON-01: Initialize A/B test path on component mount
  useEffect(() => {
    if (!isAuthenticated && !onboardingPath) {
      const path = getOnboardingPath();
      setOnboardingPath(path);
      console.log('🧪 ON-01: Initialized A/B test path =', path);
      
      // Track the path selection event
      trackOnboardingPathSelected(path, {
        sessionId: generateSessionId(),
        startTime: Date.now()
      });
    } else if (isAuthenticated && user && user.onboarding_path) {
      // Set onboarding path from user profile for existing users
      setOnboardingPath(user.onboarding_path as OnboardingPath);
      console.log('🧪 ON-01: Set onboarding path from user profile =', user.onboarding_path);
    }
  }, [isAuthenticated, onboardingPath, user]);

  // Set initial view based on user's onboarding status
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🧪 ON-01: Setting initial view based on user status:', {
        email: user.email,
        baseline_completed: user.baseline_completed,
        onboarding_path: user.onboarding_path
      });
      
      // Check if user is an existing user (has confidence scores and other profile data)
      const isExistingUser = user.confidence_meds && user.confidence_costs && user.confidence_overall && user.primary_need && user.cycle_stage;
      
      if (user.baseline_completed || isExistingUser) {
        // User has completed onboarding OR is an existing user, go directly to dashboard
        console.log('🧪 ON-01: User completed onboarding or is existing user, going to dashboard');
        setCurrentView('dashboard');
      } else {
        // User needs to complete onboarding, stay on welcome
        console.log('🧪 ON-01: User needs onboarding, staying on welcome');
        setCurrentView('welcome');
        // Explicitly hide baseline panel during welcome view
        setShowBaselinePanel(false);
      }
    }
  }, [isAuthenticated, user]);

  // ON-01: Check if user needs baseline completion when transitioning to dashboard
  useEffect(() => {
    // Only check for baseline completion when user is explicitly on dashboard view
    // AND not during the welcome view transition
    if (isAuthenticated && user && currentView === 'dashboard') {
      // For users who went through fast signup, check their stored onboarding path
      const userOnboardingPath = onboardingPath || user.onboarding_path;
      
      // Check if user is an existing user (has meaningful profile data, not just defaults)
      // A user is existing if they have a nickname OR non-default confidence scores
      // NOTE: Don't include baseline_completed in this check as it creates circular logic
      const hasNickname = user.nickname && user.nickname.trim() !== '';
      const hasNonDefaultScores = user.confidence_meds !== 5 || user.confidence_costs !== 5 || user.confidence_overall !== 5;
      const isExistingUser = hasNickname || hasNonDefaultScores;
      
      // Fast signup users need baseline if they haven't completed it and aren't existing users
      const needsBaseline = !user.baseline_completed && userOnboardingPath === 'test' && !isExistingUser;
      
      console.log('🧪 ON-01: Baseline completion check on dashboard transition:', {
        user: user.email,
        onboardingPath,
        userOnboardingPath,
        baseline_completed: user.baseline_completed,
        isExistingUser,
        needsBaseline,
        currentView,
        hasNickname,
        hasNonDefaultScores
      });
      
      if (needsBaseline && !baselineDismissed) {
        console.log('🧪 ON-01: User needs baseline completion, showing panel');
        setShowBaselinePanel(true);
        setBaselineStartTime(Date.now());
      }
    }
    
    // Reset baseline panel when user is on welcome view
    if (currentView === 'welcome') {
      setShowBaselinePanel(false);
    }
  }, [isAuthenticated, user, onboardingPath, currentView, baselineDismissed]);
  
  // Load check-in preference and today's check-in
  useEffect(() => {
    const savedPref = localStorage.getItem(`checkin_preference_${user?.email}`);
    if (savedPref) {
      const pref = JSON.parse(savedPref);
      setCheckinPreference(pref.type);
    }
    
    // Check for today's check-in
    checkForTodaysCheckin();
  }, [user]);
  
  // Check for today's check-in when switching to check-in tab
  useEffect(() => {
    if (currentView === 'checkin' && user) {
      checkForTodaysCheckin();
    }
  }, [currentView, user]);
  
  const checkForTodaysCheckin = async () => {
    if (!user) {
      setIsCheckingTodaysCheckin(false);
      return;
    }
    
    setIsCheckingTodaysCheckin(true);
    
    try {
      // Get today's date in user's local timezone
      const todayString = getLocalDateString();
      
      // Debug date information
      logTimezoneDebug('checkForTodaysCheckin');
      console.log('Looking for check-in with date:', todayString);
      
      const url = `${API_BASE_URL}/api/checkins?limit=3`; // Get last 3 to find today's
      console.log('Fetching recent check-ins from:', url, 'Looking for date:', todayString);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Check-in API response:', data);
        console.log('Response structure:', {
          success: data.success,
          checkinsCount: data.records?.length,
          firstCheckin: data.records?.[0] ? Object.keys(data.records[0]) : 'No checkins'
        });
        
        if (data.success && data.records && data.records.length > 0) {
          // Debug check-in dates
          debugCheckinDates(data.records);
          
          // Look for today's check-in among the recent ones
          let todaysCheckin = null;
          
          for (const checkin of data.records) {
            const checkinData = checkin.fields || checkin;
            if (isCheckinToday(checkinData.date_submitted)) {
              todaysCheckin = checkinData;
              break;
            }
          }
          
          if (todaysCheckin) {
            console.log('Found today\'s check-in:', todaysCheckin);
            console.log('Check-in fields:', {
              date_submitted: todaysCheckin.date_submitted,
              mood_today: todaysCheckin.mood_today,
              confidence_today: todaysCheckin.confidence_today
            });
            setTodaysCheckin(todaysCheckin);
            setShowCheckinForm(false);
          } else {
            console.log('No check-in found for today:', todayString);
            console.log('Available check-ins dates:', data.records.map((c: any) => (c.fields || c).date_submitted));
            setTodaysCheckin(null);
            setShowCheckinForm(true);
          }
        } else {
          console.log('No check-ins found');
          setTodaysCheckin(null);
          setShowCheckinForm(true);
        }
      } else {
        console.error('Failed to fetch check-ins:', response.status, response.statusText);
        setShowCheckinForm(true);
      }
    } catch (error) {
      console.error('Error checking for today\'s checkin:', error);
      setTodaysCheckin(null);
      setShowCheckinForm(true);
    } finally {
      setIsCheckingTodaysCheckin(false);
    }
  };
  
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
    console.log('Check-in completed, updating state...');
    
    // Track check-in count for preference prompt
    const count = parseInt(localStorage.getItem(`checkin_count_${user?.email}`) || '0') + 1;
    localStorage.setItem(`checkin_count_${user?.email}`, count.toString());
    
    // Refresh today's check-in status after a short delay to ensure the API is updated
    setTimeout(() => {
      checkForTodaysCheckin();
    }, 1000);
    
    // Check if it's time for weekly comprehensive check-in
    const lastComprehensive = localStorage.getItem(`last_comprehensive_${user?.email}`);
    const daysSince = lastComprehensive 
      ? Math.floor((Date.now() - new Date(lastComprehensive).getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    
    if (checkinPreference === 'quick_daily' && daysSince >= 7) {
      setShowWeeklyReminder(true);
    }
    
    setCurrentView('insights');
  };
  
  const handlePreferenceChange = (newPref: 'quick_daily' | 'comprehensive_daily') => {
    setCheckinPreference(newPref);
  };
  
  const handleSwitchToComprehensive = () => {
    localStorage.setItem(`last_comprehensive_${user?.email}`, new Date().toISOString());
    setShowWeeklyReminder(false);
    // Temporarily show comprehensive form
    setCheckinPreference('comprehensive_daily');
  };
  
  const handleReplaceCheckin = () => {
    setShowCheckinForm(true);
    setTodaysCheckin(null);
  };

  // ON-01: Handle fast onboarding completion
  const handleFastOnboardingComplete = async (data: any) => {
    console.log('🧪 ON-01: Fast onboarding completed with data:', data);
    
    // Map fast onboarding data to formData format
    const fastFormData = {
      ...formData,
      email: data.email,
      cycle_stage: data.cycle_stage,
      primary_need: data.primary_concern, // Map primary_concern to primary_need
      // Set defaults for missing fields (will be collected in Baseline Panel)
      nickname: '',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      email_opt_in: true,
      // Explicitly mark baseline as not completed for fast onboarding users
      baseline_completed: false,
      // ON-01: Save the onboarding path so we can show baseline panel later
      onboarding_path: 'test'
    };
    
    setFormData(fastFormData);
    
    try {
      const response = await apiClient.createUser(fastFormData);
      
      if (response.success && response.data) {
        console.log('✅ Fast onboarding signup successful');
        login(fastFormData.email, response.data.token, response.data.user);
        
        setJustSignedUp(true);
        setShowForm(false);
        setCurrentView('welcome');
      } else {
        alert(`Fast onboarding failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Fast onboarding error:', error);
      alert('Connection error. Please try again.');
    }
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

  // ON-01: Handle baseline panel completion
  const handleBaselineComplete = async (data: any) => {
    console.log('🧪 ON-01: Baseline panel completed with data:', data);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/baseline`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: data.nickname,
          confidence_meds: data.confidence_meds,
          confidence_costs: data.confidence_costs,
          confidence_overall: data.confidence_overall,
          top_concern: data.top_concern,
          baseline_completed: true
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('🧪 ON-01: Failed to parse response:', jsonError);
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
      }
      
      if (response.ok && result?.success) {
        console.log('🧪 ON-01: Baseline data updated successfully');
        
        // Update user data in context
        updateUser({
          nickname: data.nickname,
          confidence_meds: data.confidence_meds,
          confidence_costs: data.confidence_costs,
          confidence_overall: data.confidence_overall,
          top_concern: data.top_concern,
          baseline_completed: true
        });
        
        // Hide the panel
        setShowBaselinePanel(false);
        setBaselineDismissed(false);
      } else {
        console.error('🧪 ON-01: Failed to update baseline data:', {
          status: response.status,
          statusText: response.statusText,
          result,
          apiUrl: `${API_BASE_URL}/api/users/baseline`
        });
        
        if (response.status === 404) {
          alert('Profile update endpoint not found. Please contact support.');
        } else if (response.status === 401 || response.status === 403) {
          alert('Authentication error. Please log in again.');
        } else if (response.status === 400) {
          alert(`Validation error: ${result?.error || 'Invalid data provided'}`);
        } else {
          alert(`Failed to save your profile: ${result?.error || 'Unknown error'}. Please try again.`);
        }
      }
    } catch (error) {
      console.error('🧪 ON-01: Baseline completion error:', error);
      console.error('API URL:', `${API_BASE_URL}/api/users/baseline`);
      alert('Connection error. Please check your internet connection and try again.');
    }
  };



  // Mobile Navigation Component
  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-40">
      <div className="grid mobile-nav-grid grid-cols-3 gap-1 p-2">
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

        {/* ON-01: A/B Test Onboarding Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            {onboardingPath === 'test' ? (
              // Fast Lane Onboarding (3 questions)
              <OnboardingFast
                onComplete={handleFastOnboardingComplete}
                onBack={() => {
                  console.log('🧪 ON-01: User chose to go back to full onboarding');
                  setOnboardingPath('control');
                }}
                initialData={formData}
              />
            ) : (
              // Control Onboarding (6 questions)
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
            )}
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
        
        {/* Desktop Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'dashboard'
                    ? 'border-[#FF6F61] text-[#FF6F61]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Home</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('checkin')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'checkin'
                    ? 'border-[#FF6F61] text-[#FF6F61]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Check-in</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('insights')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'insights'
                    ? 'border-[#FF6F61] text-[#FF6F61]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Insights</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        {currentView === 'welcome' && <WelcomeInsight onContinue={() => setCurrentView('dashboard')} />}
        {currentView !== 'welcome' && (
          <>
            {/* ON-01: Baseline Panel Modal for Desktop */}
            {showBaselinePanel && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <BaselinePanel
                  onComplete={handleBaselineComplete}
                  onClose={() => {
                    console.log('🧪 ON-01: User dismissed baseline panel before completion');
                    setShowBaselinePanel(false);
                    setBaselineDismissed(true);
                  }}
                  userEmail={user?.email || ''}
                  sessionId={sessionStorage.getItem('novara_onboarding_session_id') || ''}
                  startTime={baselineStartTime}
                />
              </div>
            )}
            <section className="max-w-4xl mx-auto px-6 py-12">
              {/* Desktop Dashboard View */}
              {currentView === 'dashboard' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">
                      Welcome back, {user?.nickname || user?.email?.split('@')[0]}! 👋
                    </h2>
                    <p className="text-lg text-gray-600">
                      Your personalized dashboard shows how your actions impact outcomes
                    </p>
                  </div>
                  
                  {/* Outcome Metrics Dashboard */}
                  <div className="mb-8">
                    <OutcomeMetricsDashboard />
                  </div>
                  
                  {/* Smart Checklist Card */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Smart Prep Checklist</h3>
                    <ChecklistCard
                      onComplete={() => {
                        console.log('Desktop checklist completed');
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              {/* Desktop Check-in View */}
              {currentView === 'checkin' && (
                <div>
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
                          Daily Check-in
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                          Share how you're feeling today and get personalized insights.
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* Desktop Daily Check-in Form */}
                  <div className="flex justify-center">
                    {baselineDismissed && !user?.baseline_completed ? (
                      <div className="w-full max-w-md bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                          <span className="text-yellow-600 text-xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          Complete Your Profile Setup
                        </h3>
                        <p className="text-yellow-700 mb-4">
                          To receive personalized insights and questions tailored to your journey, please complete your profile setup.
                        </p>
                        <Button
                          onClick={() => {
                            setBaselineDismissed(false);
                            setShowBaselinePanel(true);
                            setBaselineStartTime(Date.now());
                          }}
                          className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                        >
                          Complete Profile Setup
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full max-w-2xl">
                        <CheckinPreferenceToggle 
                          currentPreference={checkinPreference}
                          onPreferenceChange={handlePreferenceChange}
                        />
                        
                        {showWeeklyReminder && (
                          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mb-4">
                            <CardContent className="p-4">
                              <p className="text-sm text-purple-800 font-medium mb-2">
                                📅 It's been a week! Time for your comprehensive check-in.
                              </p>
                              <p className="text-xs text-purple-600 mb-3">
                                This helps us provide deeper insights and better personalization.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSwitchToComprehensive}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Do comprehensive check-in
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowWeeklyReminder(false)}
                                >
                                  Maybe later
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {isCheckingTodaysCheckin ? (
                          <Card className="border-gray-200">
                            <CardContent className="p-6 text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                              <p className="text-gray-600">Checking today's status...</p>
                            </CardContent>
                          </Card>
                        ) : todaysCheckin && !showCheckinForm ? (
                          <TodaysCheckinStatus
                            lastCheckinTime={todaysCheckin.date_submitted}
                            lastMood={todaysCheckin.mood_today}
                            lastConfidence={todaysCheckin.confidence_today}
                            onReplaceCheckin={handleReplaceCheckin}
                            onViewInsights={() => setCurrentView('insights')}
                          />
                        ) : (
                          <>
                            {checkinPreference === 'quick_daily' ? (
                              <QuickDailyCheckinForm 
                                onComplete={handleCheckinComplete}
                                onSwitchToFull={handleSwitchToComprehensive}
                              />
                            ) : (
                              <EnhancedDailyCheckinForm onComplete={handleCheckinComplete} />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Desktop Insights View */}
              {currentView === 'insights' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">
                      Your Insights
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Personalized insights based on your check-ins and journey progress.
                    </p>
                  </div>
                  
                  {/* Desktop Daily Insights Display */}
                  <div className="flex justify-center">
                    <DailyInsightsDisplay />
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Mobile Content */}
      <div className="block md:hidden">
        {currentView === 'welcome' && <WelcomeInsight onContinue={() => setCurrentView('dashboard')} />}
        {currentView === 'dashboard' && (
          <>
            {/* ON-01: Baseline Panel Modal for Mobile */}
            {showBaselinePanel && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <BaselinePanel
                  onComplete={handleBaselineComplete}
                  onClose={() => {
                    console.log('🧪 ON-01: User dismissed baseline panel before completion');
                    setShowBaselinePanel(false);
                    setBaselineDismissed(true);
                  }}
                  userEmail={user?.email || ''}
                  sessionId={sessionStorage.getItem('novara_onboarding_session_id') || ''}
                  startTime={baselineStartTime}
                />
              </div>
            )}
            <div className="p-3 pb-24 space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Your Dashboard</h2>
                <p className="text-sm text-gray-600">Track how your actions impact outcomes</p>
              </div>
              
              {/* Outcome Metrics Dashboard for Mobile */}
              <OutcomeMetricsDashboard onNavigate={(view) => setCurrentView(view as any)} />
              
              {/* Smart Checklist */}
              <div>
                <h3 className="text-base font-semibold mb-2">Today's Smart Prep</h3>
                <ChecklistCard
                  onComplete={() => {
                    console.log('Checklist completed');
                  }}
                />
              </div>
              
              {baselineDismissed && !user?.baseline_completed && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                  <h3 className="text-base font-semibold text-yellow-800 mb-2">
                    Complete Your Profile Setup
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    To receive personalized insights and questions tailored to your journey, please complete your profile setup.
                  </p>
                  <Button
                    onClick={() => {
                      setBaselineDismissed(false);
                      setShowBaselinePanel(true);
                      setBaselineStartTime(Date.now());
                    }}
                    className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white text-sm py-2"
                  >
                    Complete Profile Setup
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        {currentView === 'checkin' && (
          <div className="pb-24 px-4">
            <CheckinPreferenceToggle 
              currentPreference={checkinPreference}
              onPreferenceChange={handlePreferenceChange}
            />
            
            {showWeeklyReminder && (
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mb-4">
                <CardContent className="p-4">
                  <p className="text-sm text-purple-800 font-medium mb-2">
                    📅 It's been a week! Time for your comprehensive check-in.
                  </p>
                  <p className="text-xs text-purple-600 mb-3">
                    This helps us provide deeper insights and better personalization.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSwitchToComprehensive}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Do comprehensive check-in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowWeeklyReminder(false)}
                    >
                      Maybe later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {isCheckingTodaysCheckin ? (
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600">Checking today's status...</p>
                </CardContent>
              </Card>
            ) : todaysCheckin && !showCheckinForm ? (
              <TodaysCheckinStatus
                lastCheckinTime={todaysCheckin.date_submitted}
                lastMood={todaysCheckin.mood_today}
                lastConfidence={todaysCheckin.confidence_today}
                onReplaceCheckin={handleReplaceCheckin}
                onViewInsights={() => setCurrentView('insights')}
              />
            ) : (
              <>
                {checkinPreference === 'quick_daily' ? (
                  <QuickDailyCheckinForm 
                    onComplete={handleCheckinComplete}
                    onSwitchToFull={handleSwitchToComprehensive}
                  />
                ) : (
                  <EnhancedDailyCheckinForm onComplete={handleCheckinComplete} />
                )}
              </>
            )}
          </div>
        )}
        {currentView === 'insights' && <div className="px-4 py-6 pb-24"><DailyInsightsDisplay /></div>}
        
        {currentView !== 'welcome' && <MobileNavigation />}
      </div>
    </div>
  );
};

export default NovaraLanding;