import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackDailyCheckin, trackInsightGeneration, trackEvent } from '../lib/analytics';
import { API_BASE_URL } from '../lib/environment';

interface DailyCheckinFormProps {
  onComplete?: () => void;
}

interface Question {
  id: string;
  type: 'text' | 'slider' | 'select';
  question: string;
  placeholder?: string;
  required: boolean;
  priority: number;
  context?: string;
  min?: number;
  max?: number;
  options?: string[];
}

interface PersonalizationSummary {
  medication_focus: boolean;
  financial_focus: boolean;
  journey_focus: boolean;
  top_concern: string | null;
}

const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({ onComplete }) => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Dynamic form state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [personalization, setPersonalization] = useState<PersonalizationSummary | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // Enhanced mood selection state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [immediateInsight, setImmediateInsight] = useState<{ 
    title: string; 
    message: string; 
    action?: { label: string; type: string } | null;
    enhanced?: boolean;
    tracking_data?: any;
  } | null>(null);

  // Clean mood options with better visual hierarchy
  const moodOptions = [
    { 
      mood: 'hopeful', 
      label: 'Hopeful', 
      icon: '🌟',
      description: 'Feeling positive about the journey',
      color: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800'
    },
    { 
      mood: 'anxious', 
      label: 'Anxious', 
      icon: '😰',
      description: 'Worried about what\'s ahead',
      color: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
    },
    { 
      mood: 'overwhelmed', 
      label: 'Overwhelmed', 
      icon: '🌊',
      description: 'Everything feels like too much',
      color: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800'
    },
    { 
      mood: 'frustrated', 
      label: 'Frustrated', 
      icon: '😤',
      description: 'Things aren\'t going as planned',
      color: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-800'
    },
    { 
      mood: 'grateful', 
      label: 'Grateful', 
      icon: '🙏',
      description: 'Appreciating support and progress',
      color: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800'
    },
    { 
      mood: 'tired', 
      label: 'Tired', 
      icon: '😴',
      description: 'Physically or emotionally drained',
      color: 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
    },
    { 
      mood: 'excited', 
      label: 'Excited', 
      icon: '✨',
      description: 'Looking forward to next steps',
      color: 'border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-800'
    },
    { 
      mood: 'worried', 
      label: 'Worried', 
      icon: '😟',
      description: 'Concerned about specific outcomes',
      color: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800'
    }
  ];

  // Fetch personalized questions and last values when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch both simultaneously but handle completion properly
      const initializeForm = async () => {
        setIsLoadingQuestions(true);
        try {
          // Execute both operations in parallel
          const [questionsResult, lastValuesResult] = await Promise.allSettled([
            fetchPersonalizedQuestions(),
            fetchLastCheckinValues()
          ]);
          
          // Log any failures without blocking the UI
          if (questionsResult.status === 'rejected') {
            console.warn('Failed to fetch personalized questions:', questionsResult.reason);
          }
          if (lastValuesResult.status === 'rejected') {
            console.warn('Failed to fetch last check-in values:', lastValuesResult.reason);
          }
        } catch (error) {
          console.error('Error initializing form:', error);
        } finally {
          setIsLoadingQuestions(false);
        }
      };
      
      initializeForm();
    }
  }, [isAuthenticated]);

  const fetchLastCheckinValues = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token for fetching last values');
        return;
      }

      console.log('📊 Fetching last check-in values...');
      
      const response = await fetch(`${API_BASE_URL}/api/checkins/last-values`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📝 Last values response:', data);

      if (response.ok && data.success && data.last_values) {
        console.log('✅ Loaded last check-in values:', data.last_values);
        // Store last values for use when questions are loaded
        localStorage.setItem('lastCheckinValues', JSON.stringify(data.last_values));
      } else {
        console.warn('⚠️ Could not fetch last values, will use defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching last values:', error);
      // Don't show error to user, just use defaults
    }
  };

  const fetchPersonalizedQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setQuestionsError('Authentication token missing');
        return;
      }

      console.log('🎯 Fetching personalized questions...');
      
      const response = await fetch(`${API_BASE_URL}/api/checkins/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📝 Questions response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.error || 'Failed to fetch questions');
      }

      if (data.success && data.questions) {
        setQuestions(data.questions);
        setPersonalization(data.personalization_summary);
        console.log(`✅ Loaded ${data.questions.length} personalized questions`);
        
        // Get last check-in values for defaults
        const lastValues = JSON.parse(localStorage.getItem('lastCheckinValues') || '{}');
        console.log('📊 Using last values as defaults:', lastValues);
        
        // Initialize form responses with last values or defaults
        const initialResponses: Record<string, any> = {
          confidence_today: lastValues.confidence_today || 5 // Use last confidence or default to 5
        };
        data.questions.forEach((q: Question) => {
          if (q.type === 'slider') {
            // Use last value if available, otherwise use midpoint
            const lastValue = lastValues[q.id];
            if (lastValue !== null && lastValue !== undefined) {
              initialResponses[q.id] = lastValue;
            } else {
              initialResponses[q.id] = q.min ? Math.ceil((q.min + (q.max || 10)) / 2) : 5;
            }
          } else {
            initialResponses[q.id] = '';
          }
        });
        setFormResponses(initialResponses);
      } else {
        setQuestionsError('Failed to load personalized questions');
      }
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      setQuestionsError('Connection error. Please try again.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Toggle mood selection for multiple moods
  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please log in to submit a check-in');
      return;
    }

    console.log('🐛 DEBUG - selectedMoods at submit:', selectedMoods);
    console.log('🐛 DEBUG - selectedMoods.length:', selectedMoods.length);

    if (selectedMoods.length === 0) {
      alert('Please select at least one mood');
      return;
    }

    // Validate required personalized fields
    const requiredQuestions = questions.filter(q => q.required && q.id !== 'mood_today' && q.id !== 'confidence_today');
    const missingRequired = requiredQuestions.find(q => 
      !formResponses[q.id] || (typeof formResponses[q.id] === 'string' && formResponses[q.id].trim() === '')
    );

    if (missingRequired) {
      alert(`Please fill in the required field: ${missingRequired.question}`);
      return;
    }

    setIsSubmitting(true);

    // Prepare enhanced check-in data - merge mood with personalized responses
    const enhancedCheckinData = {
      ...formResponses,
      mood_today: selectedMoods.join(', '), // Put this AFTER formResponses so it doesn't get overwritten
      confidence_today: formResponses.confidence_today || 5, // Ensure confidence_today is always present
    };
    
    console.log('🐛 DEBUG - enhancedCheckinData.mood_today:', enhancedCheckinData.mood_today);
    console.log('🎯 Submitting enhanced check-in data:', enhancedCheckinData);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        logout();
        return;
      }

      // Use imported API_BASE_URL from environment configuration
      
      // Submit enhanced check-in
      const response = await fetch(`${API_BASE_URL}/api/daily-checkin-enhanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancedCheckinData)
      });

      const responseData = await response.json();
      console.log('📡 Enhanced check-in response:', responseData);

      if (!response.ok) {
        if (response.status === 401 || responseData.error?.includes('token') || responseData.error?.includes('expired')) {
          alert('Your session has expired. Please log in again.');
          logout();
          return;
        }
        throw new Error(responseData.error || `Check-in failed: ${response.statusText}`);
      }

      if (response.ok && responseData.success) {
        // Track enhanced check-in completion
        trackDailyCheckin(selectedMoods.join(','), (enhancedCheckinData as any).confidence_today || 5);
        trackEvent('Check-in', 'completed', 'enhanced');
        
        // Display enhanced insight
        if (responseData.enhanced_insight) {
          setImmediateInsight(responseData.enhanced_insight);
          
          // Track enhanced insight delivery
          trackInsightGeneration(responseData.enhanced_insight.enhanced ? 'enhanced_checkin_micro' : 'checkin_micro');
          trackEvent('Insights', 'delivered', responseData.enhanced_insight.title);
        } else {
          setImmediateInsight({
            title: 'Enhanced Check-in Complete!',
            message: 'Thank you for sharing your detailed check-in. Your personalized insights are being prepared.',
            enhanced: true
          });
        }
        
        setShowSuccess(true);
        
        // Reset form with last values
        setSelectedMoods([]);
        const lastValues = JSON.parse(localStorage.getItem('lastCheckinValues') || '{}');
        const resetResponses: Record<string, any> = {
          confidence_today: lastValues.confidence_today || 5 // Use last confidence or default to 5
        };
        questions.forEach(q => {
          if (q.type === 'slider') {
            // Use last value if available, otherwise use midpoint
            const lastValue = lastValues[q.id];
            if (lastValue !== null && lastValue !== undefined) {
              resetResponses[q.id] = lastValue;
            } else {
              resetResponses[q.id] = q.min ? Math.ceil((q.min + (q.max || 10)) / 2) : 5;
            }
          } else {
            resetResponses[q.id] = '';
          }
        });
        setFormResponses(resetResponses);
        
        // Don't auto-call onComplete - let user dismiss manually via Continue button
      } else {
        console.error('❌ Enhanced check-in failed:', responseData);
        alert(`Check-in failed: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalizedQuestion = (question: Question) => {
    const value = formResponses[question.id];
    
    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.context && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                ✨ {question.context.replace('_', ' ')} question
              </div>
            )}
            <Textarea
              value={value || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder={question.placeholder || 'Share your thoughts...'}
              className="resize-none border-gray-200 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
              rows={3}
            />
          </div>
        );
        
      case 'slider':
        const min = question.min || 1;
        const max = question.max || 10;
        const numValue = Number(value) || min;
        
        return (
          <div key={question.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.context && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                ✨ {question.context.replace('_', ' ')} question
              </div>
            )}
            {(() => {
              const lastValues = JSON.parse(localStorage.getItem('lastCheckinValues') || '{}');
              if (lastValues[question.id] && lastValues.last_checkin_date) {
                return (
                  <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                    📊 Using your last value: {lastValues[question.id]}/10 (from {lastValues.last_checkin_date})
                  </div>
                );
              }
              return null;
            })()}
            <input
              type="range"
              min={min}
              max={max}
              value={numValue}
              onChange={(e) => handleResponseChange(question.id, Number(e.target.value))}
              className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
              style={{
                background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((numValue - min) / (max - min)) * 100}%, #e5e7eb ${((numValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`
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
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low ({min})</span>
              <span className="font-medium text-[#FF6F61]">{numValue}/{max}</span>
              <span>High ({max})</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <Heart className="w-12 h-12 text-[#FF6F61] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ready for your daily check-in?</h3>
          <p className="text-sm text-gray-600 mb-4">Please log in to track your IVF journey.</p>
          <Button className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading questions state
  if (isLoadingQuestions) {
    return (
      <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 text-[#FF6F61] mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalizing Your Check-in</h3>
          <p className="text-sm text-gray-600">Loading questions tailored to your concerns...</p>
        </CardContent>
      </Card>
    );
  }

  // Questions error state
  if (questionsError) {
    return (
      <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <Heart className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Questions</h3>
          <p className="text-sm text-gray-600 mb-4">{questionsError}</p>
          <Button 
            onClick={fetchPersonalizedQuestions}
            className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen md:min-h-0 bg-[#FFF5F0] md:bg-transparent flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2 border-[#FF6F61] bg-gradient-to-br from-[#FFF5F0] to-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#FF6F61] mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              {immediateInsight?.title || 'Enhanced Check-in Complete!'}
            </h3>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#CBA7FF]/30 mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {immediateInsight?.message}
              </p>
              {immediateInsight?.enhanced && (
                <div className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block">
                  💚 Personalized for you
                </div>
              )}
            </div>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                if (onComplete) {
                  onComplete();
                }
              }}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white py-3 text-lg"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get personalized questions excluding the baseline mood/confidence (we handle those graphically)
  const personalizedQuestions = questions.filter(q => 
    q.id !== 'mood_today' && q.id !== 'confidence_today'
  );

  // Check validation for submit button
  const baselineValid = selectedMoods.length > 0 && formResponses.confidence_today;
  const requiredPersonalizedValid = personalizedQuestions
    .filter(q => q.required)
    .every(q => {
      const response = formResponses[q.id];
      return response !== undefined && response !== null && response !== '';
    });
  const canSubmit = baselineValid && requiredPersonalizedValid;

  // Enhanced form rendering with both graphical and personalized sections
  return (
    <>
      {/* Desktop Form - Enhanced */}
      <div className="hidden md:block desktop-only">
        <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              <Heart className="w-5 h-5 text-[#FF6F61]" />
              Enhanced Daily Check-In
              {user?.nickname && <span className="text-sm font-normal text-gray-500">Hi, {user.nickname}!</span>}
            </CardTitle>
            {personalization && (
              <div className="text-xs text-gray-600">
                ✨ Personalized for: {[
                  personalization.medication_focus && 'medication concerns',
                  personalization.financial_focus && 'financial planning', 
                  personalization.journey_focus && 'journey readiness',
                  personalization.top_concern && `"${personalization.top_concern}"`
                ].filter(Boolean).join(', ')}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Mood Selection - Multiple Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  How are you feeling today? (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {moodOptions.map(({ mood, label, icon, description, color }) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => toggleMood(mood)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedMoods.includes(mood)
                          ? 'border-[#FF6F61] bg-[#FF6F61]/10 ring-2 ring-[#FF6F61]/20' 
                          : color
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{icon}</span>
                        <span className="font-medium text-sm">{label}</span>
                        {selectedMoods.includes(mood) && (
                          <CheckCircle className="w-4 h-4 text-[#FF6F61] ml-auto" />
                        )}
                      </div>
                      <p className="text-xs opacity-75 leading-tight">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
                {selectedMoods.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedMoods.join(', ')}
                  </p>
                )}
              </div>

                        {/* Confidence Today */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence in your journey today (1-10):
            </label>
            {(() => {
              const lastValues = JSON.parse(localStorage.getItem('lastCheckinValues') || '{}');
              if (lastValues.confidence_today && lastValues.last_checkin_date) {
                return (
                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-2">
                    📊 Using your last value: {lastValues.confidence_today}/10 (from {lastValues.last_checkin_date})
                  </div>
                );
              }
              return null;
            })()}
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formResponses.confidence_today || 5}
                  onChange={(e) => handleResponseChange('confidence_today', Number(e.target.value))}
                  className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
                  style={{
                    background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((formResponses.confidence_today - 1) / 9) * 100}%, #e5e7eb ${((formResponses.confidence_today - 1) / 9) * 100}%, #e5e7eb 100%)`
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not confident</span>
                  <span className="font-medium text-[#FF6F61]">{formResponses.confidence_today || 5}/10</span>
                  <span>Very confident</span>
                </div>
              </div>

              {/* Personalized Questions */}
              {personalizedQuestions.map(renderPersonalizedQuestion)}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Saving Enhanced Check-in...
                  </>
                ) : (
                  `Complete Enhanced Check-in (${questions.length} questions)`
                )}
              </Button>
              
              {!canSubmit && (
                <p className="text-xs text-gray-500 text-center">
                  Please fill in all required fields
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Form - Enhanced with full UI */}
      <div className="block md:hidden mobile-only min-h-screen bg-[#FFF5F0]">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6 text-[#FF6F61]" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Enhanced Check-in</h1>
                {user?.nickname && (
                  <p className="text-sm text-gray-600">Hi {user.nickname}! Let's see how you're doing today</p>
                )}
              </div>
            </div>
            <div className="text-2xl">✨</div>
          </div>
          {personalization && (
            <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
              ✨ Personalized for: {[
                personalization.medication_focus && 'medication',
                personalization.financial_focus && 'financial', 
                personalization.journey_focus && 'journey',
                personalization.top_concern && `"${personalization.top_concern}"`
              ].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-8 pb-40">
          {/* Mobile Mood Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              How are you feeling today?
              <span className="block text-sm font-normal text-gray-600 mt-1">
                Select all that apply
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {moodOptions.map(({ mood, label, icon, description, color }) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`p-4 rounded-xl border-2 transition-all text-left active:scale-95 min-h-[100px] flex flex-col justify-between relative ${
                    selectedMoods.includes(mood)
                      ? 'border-[#FF6F61] bg-[#FF6F61]/10 ring-2 ring-[#FF6F61]/20 scale-95' 
                      : color
                  }`}
                >
                  {selectedMoods.includes(mood) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-[#FF6F61]" />
                    </div>
                  )}
                  
                  <div className="flex flex-col justify-between h-full pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <span className="font-medium text-sm leading-tight">{label}</span>
                    </div>
                    <p className="text-xs opacity-75 leading-tight">
                      {description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {selectedMoods.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Selected moods:</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedMoods.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Confidence Slider */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Confidence Level Today
            </h2>
            {(() => {
              const lastValues = JSON.parse(localStorage.getItem('lastCheckinValues') || '{}');
              if (lastValues.confidence_today && lastValues.last_checkin_date) {
                return (
                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-4">
                    📊 Using your last value: {lastValues.confidence_today}/10 (from {lastValues.last_checkin_date})
                  </div>
                );
              }
              return null;
            })()}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-[#FF6F61] mb-2">{formResponses.confidence_today || 5}/10</div>
              <div className="text-sm text-gray-600">
                {(formResponses.confidence_today || 5) <= 3 && "Taking it one step at a time"}
                {(formResponses.confidence_today || 5) > 3 && (formResponses.confidence_today || 5) <= 6 && "Finding your rhythm"}
                {(formResponses.confidence_today || 5) > 6 && (formResponses.confidence_today || 5) <= 8 && "Feeling strong"}
                {(formResponses.confidence_today || 5) > 8 && "Absolutely crushing it!"}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={formResponses.confidence_today || 5}
              onChange={(e) => handleResponseChange('confidence_today', Number(e.target.value))}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${(((formResponses.confidence_today || 5) - 1) / 9) * 100}%, #e5e7eb ${(((formResponses.confidence_today || 5) - 1) / 9) * 100}%, #e5e7eb 100%)`
              }}
            />
            <style dangerouslySetInnerHTML={{
              __html: `
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #FF6F61;
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #FF6F61;
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
              `
            }} />
            <div className="flex justify-between text-xs text-gray-500 mt-3">
              <span>Not confident</span>
              <span>Very confident</span>
            </div>
          </div>

          {/* Mobile Personalized Questions */}
          {personalizedQuestions.map((question) => (
            <div key={question.id} className="bg-white p-6 rounded-xl shadow-sm">
              {renderPersonalizedQuestion(question)}
            </div>
          ))}
        </div>

        {/* Mobile Fixed Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
              !canSubmit || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#FF6F61] text-white hover:bg-[#e55a4d] shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Saving Enhanced Check-in...</span>
              </div>
            ) : (
              `Complete Enhanced Check-in (${questions.length} questions)`
            )}
          </button>
          {!canSubmit && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Please fill in all required fields
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyCheckinForm;