import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Calendar, MessageCircle } from 'lucide-react';

const NovaraLanding = () => {
  // Load DM Sans font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Apply font to body
    document.body.style.fontFamily = "'DM Sans', sans-serif";

    return () => {
      document.head.removeChild(link);
    };
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    primary_need: '',
    cycle_stage: '',
    top_concern: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    email_opt_in: true,
    status: 'active'
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://novara-mvp-production.up.railway.app/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Welcome to Novara! Your journey starts now. 💜');
        setShowForm(false);
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Connection error. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-novara-cream via-white to-novara-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-novara-coral/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-novara-coral to-novara-lavender flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-novara-coral to-novara-lavender bg-clip-text text-transparent">
              Novara
            </h1>
          </div>
          <Badge variant="secondary" className="bg-novara-lavender/20 text-novara-coral border-novara-coral/30">
            Your IVF Journey Support
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            You don't have to navigate
            <br />
            <span className="bg-gradient-to-r from-novara-coral to-novara-lavender bg-clip-text text-transparent">
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
              className="bg-novara-coral hover:bg-novara-coral/90 text-white px-8 py-3 text-lg"
            >
              Start Your Journey
            </Button>
            <Button variant="outline" className="border-novara-coral text-novara-coral hover:bg-novara-coral/5 px-8 py-3 text-lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-novara-coral/20 hover:shadow-lg transition-all duration-300 hover:border-novara-coral/40">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-novara-coral/10 flex items-center justify-center mb-4 mx-auto">
                <Calendar className="w-6 h-6 text-novara-coral" />
              </div>
              <CardTitle className="text-xl">Personalized Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Track your cycle, appointments, and milestones with intelligent insights tailored to your unique journey.
              </p>
            </CardContent>
          </Card>

          <Card className="border-novara-lavender/20 hover:shadow-lg transition-all duration-300 hover:border-novara-lavender/40">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-novara-lavender/10 flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="w-6 h-6 text-novara-lavender" />
              </div>
              <CardTitle className="text-xl">Daily Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Share how you're feeling and receive personalized micro-insights that acknowledge your experience.
              </p>
            </CardContent>
          </Card>

          <Card className="border-novara-coral/20 hover:shadow-lg transition-all duration-300 hover:border-novara-coral/40">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-novara-coral/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-novara-coral" />
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

      {/* Onboarding Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-novara-coral to-novara-lavender bg-clip-text text-transparent">
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
                      className="border-novara-coral/30 focus:border-novara-coral"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nickname">What should we call you?</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      placeholder="Your preferred name"
                      className="border-novara-coral/30 focus:border-novara-coral"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cycle_stage">Where are you in your journey?</Label>
                  <Select onValueChange={(value) => handleInputChange('cycle_stage', value)}>
                    <SelectTrigger className="border-novara-coral/30 focus:border-novara-coral">
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
                    <SelectTrigger className="border-novara-coral/30 focus:border-novara-coral">
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
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.confidence_meds}
                        onChange={(e) => handleInputChange('confidence_meds', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-novara-coral focus:ring-opacity-50"
                        style={{
                          background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${(formData.confidence_meds - 1) * 11.11}%, #e5e7eb ${(formData.confidence_meds - 1) * 11.11}%, #e5e7eb 100%)`
                        }}
                      />
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          input[type="range"]::-webkit-slider-thumb {
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                          input[type="range"]::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                        `
                      }} />
                    </div>
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
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.confidence_costs}
                        onChange={(e) => handleInputChange('confidence_costs', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-novara-coral focus:ring-opacity-50"
                        style={{
                          background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${(formData.confidence_costs - 1) * 11.11}%, #e5e7eb ${(formData.confidence_costs - 1) * 11.11}%, #e5e7eb 100%)`
                        }}
                      />
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          input[type="range"]::-webkit-slider-thumb {
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                          input[type="range"]::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                        `
                      }} />
                    </div>
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
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.confidence_overall}
                        onChange={(e) => handleInputChange('confidence_overall', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-novara-coral focus:ring-opacity-50"
                        style={{
                          background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${(formData.confidence_overall - 1) * 11.11}%, #e5e7eb ${(formData.confidence_overall - 1) * 11.11}%, #e5e7eb 100%)`
                        }}
                      />
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          input[type="range"]::-webkit-slider-thumb {
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                          input[type="range"]::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #FF6F61;
                            cursor: pointer;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                          }
                        `
                      }} />
                    </div>
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
                    className="border-novara-coral/30 focus:border-novara-coral resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 bg-novara-cream/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="email_opt_in"
                    checked={formData.email_opt_in}
                    onChange={(e) => handleInputChange('email_opt_in', e.target.checked)}
                    className="w-4 h-4 text-novara-coral bg-gray-100 border-gray-300 rounded focus:ring-novara-coral focus:ring-2"
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
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.email}
                    className="flex-1 bg-novara-coral hover:bg-novara-coral/90 text-white"
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
      <footer className="bg-white/50 border-t border-novara-coral/20 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600">
            Built with care for those navigating fertility treatment. 
            <span className="text-novara-coral"> Your journey matters.</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NovaraLanding;