import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Calendar, MessageCircle, ArrowRight, CheckCircle, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import DailyCheckinForm from './DailyCheckinForm';
import DailyInsightsDisplay from './DailyInsightsDisplay';

const NovaraLanding = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
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

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-novara-cream via-white to-novara-cream flex items-center justify-center">
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
        // Auto-login after successful signup
        login(formData.email, response.data.token, response.data.user);
        setJustSignedUp(true);
        setShowForm(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFF5F0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
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
            {isAuthenticated ? (
              <>
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
              </>
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
            <Badge variant="secondary" className="bg-[#CBA7FF]/20 text-[#FF6F61] border-[#FF6F61]/30">
              Your IVF Journey Support
            </Badge>
          </div>
        </div>
      </header>

      {/* Welcome Back Section (For Authenticated Users) */}
      {isAuthenticated && (
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
                
                {/* Progression Indicator */}
                <div className="flex items-center justify-center space-x-4 mb-8 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Account Created</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-[#FF6F61] animate-pulse" />
                    <span className="font-medium text-[#FF6F61]">First Check-in</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-300" />
                    <span>Daily Insights</span>
                  </div>
                </div>
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
          
          {/* Daily Insights Display - NEW! */}
          <div className="flex justify-center mb-6">
            <DailyInsightsDisplay />
          </div>
          
          {/* Daily Check-in Form */}
          <div className="flex justify-center">
            <DailyCheckinForm />
          </div>
          
          {/* Next Steps Preview - Only for new users */}
          {justSignedUp && (
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">What happens next?</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="p-4 bg-white/50 rounded-lg border border-[#FF6F61]/20">
                  <MessageCircle className="w-6 h-6 text-[#FF6F61] mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Get personalized insights based on your daily check-ins</p>
                </div>
                <div className="p-4 bg-white/50 rounded-lg border border-[#CBA7FF]/20">
                  <Calendar className="w-6 h-6 text-[#CBA7FF] mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Track your journey timeline and milestones</p>
                </div>
                <div className="p-4 bg-white/50 rounded-lg border border-[#FF6F61]/20">
                  <Users className="w-6 h-6 text-[#FF6F61] mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Access expert guidance when you need it</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Original Hero Section (For Non-Authenticated Users) */}
      {!isAuthenticated && (
        <>
          <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-6 leading-tight">
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
              <div className="flex gap-4 justify-center">
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

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
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
        </>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
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

      {/* Signup Form Modal - Complete Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-[#FF6F61] to-[#CBA7FF] bg-clip-text text-transparent">
                Welcome to Novara
              </CardTitle>
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
                    How confident do you feel about IVF medications? ({formData.confidence_meds}/10)
                  </Label>
                  <div className="mt-4 px-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.confidence_meds}
                      onChange={(e) => handleInputChange('confidence_meds', parseInt(e.target.value))}
                      className="w-full h-3 cursor-pointer rounded-lg"
                      style={{
                        background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_meds - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_meds - 1) / 9) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        outline: 'none'
                      }}
                    />
                    <style dangerouslySetInnerHTML={{
                      __html: `
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
                      `
                    }} />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Not confident</span>
                      <span>Very confident</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confidence_costs">
                    How confident do you feel about IVF costs/insurance? ({formData.confidence_costs}/10)
                  </Label>
                  <div className="mt-4 px-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.confidence_costs}
                      onChange={(e) => handleInputChange('confidence_costs', parseInt(e.target.value))}
                      className="w-full h-3 cursor-pointer rounded-lg"
                      style={{
                        background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_costs - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_costs - 1) / 9) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        outline: 'none'
                      }}
                    />
                    <style dangerouslySetInnerHTML={{
                      __html: `
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
                      `
                    }} />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Not confident</span>
                      <span>Very confident</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confidence_overall">
                    How confident do you feel about your IVF journey overall? ({formData.confidence_overall}/10)
                  </Label>
                  <div className="mt-4 px-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.confidence_overall}
                      onChange={(e) => handleInputChange('confidence_overall', parseInt(e.target.value))}
                      className="w-full h-3 cursor-pointer rounded-lg"
                      style={{
                        background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formData.confidence_overall - 1) / 9) * 100}%, #e5e7eb ${((formData.confidence_overall - 1) / 9) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        outline: 'none'
                      }}
                    />
                    <style dangerouslySetInnerHTML={{
                      __html: `
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
                      `
                    }} />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Not confident</span>
                      <span>Very confident</span>
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

                <div className="flex items-center space-x-2 p-4 bg-[#FFF5F0]/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="email_opt_in"
                    checked={formData.email_opt_in}
                    onChange={(e) => handleInputChange('email_opt_in', e.target.checked)}
                    className="w-4 h-4 text-[#FF6F61] bg-gray-100 border-gray-300 rounded focus:ring-[#FF6F61] focus:ring-2"
                  />
                  <Label htmlFor="email_opt_in" className="text-sm text-gray-700">
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

      {/* Footer */}
      <footer className="bg-white/50 border-t border-[#FF6F61]/20 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600">
            Built with care for those navigating fertility treatment. 
            <span className="text-[#FF6F61]"> Your journey matters.</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NovaraLanding;