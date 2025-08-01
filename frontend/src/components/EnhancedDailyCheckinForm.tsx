// Enhanced Daily Check-in Form with Evidence-Based Data Capture
// Includes: PHQ-4, medication adherence, anxiety levels, side effects tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, CheckCircle, Loader2, Pill, 
  Brain, TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackCheckinSubmitted } from '../lib/analytics';
import { API_BASE_URL } from '../lib/environment';
// PHQ-4 import removed - should be a separate flow
import { UnifiedSlider } from './UnifiedSlider';
import { MetricTooltip } from './MetricTooltip';
import { getLocalDateString } from '../lib/dateUtils';

interface EnhancedDailyCheckinFormProps {
  onComplete?: () => void;
}

// Enhanced checkin data interface - not used directly but shows the data structure

// Mood options with supportive, validating messages
const ENHANCED_MOOD_OPTIONS = [
  { 
    mood: 'hopeful', 
    label: 'Hopeful', 
    icon: '🌟',
    supportMessage: 'Your hope is a strength'
  },
  { 
    mood: 'anxious',
    label: 'Anxious', 
    icon: '😰',
    supportMessage: 'It\'s okay to feel anxious'
  },
  { 
    mood: 'overwhelmed',
    label: 'Overwhelmed', 
    icon: '🌊',
    supportMessage: 'You\'re managing a lot'
  },
  { 
    mood: 'frustrated',
    label: 'Frustrated', 
    icon: '😤',
    supportMessage: 'Your feelings are valid'
  },
  { 
    mood: 'grateful',
    label: 'Grateful', 
    icon: '🙏',
    supportMessage: 'Gratitude is powerful'
  },
  { 
    mood: 'tired',
    label: 'Tired', 
    icon: '😴',
    supportMessage: 'Rest is important too'
  },
  { 
    mood: 'excited',
    label: 'Excited', 
    icon: '🎉',
    supportMessage: 'Wonderful to feel excited'
  },
  { 
    mood: 'worried',
    label: 'Worried', 
    icon: '😟',
    supportMessage: 'We\'re here to support you'
  }
];

const SIDE_EFFECTS_OPTIONS = [
  'Headache',
  'Bloating',
  'Mood swings',
  'Hot flashes',
  'Injection site reaction',
  'Nausea',
  'Fatigue',
  'Breast tenderness',
  'Cramping',
  'Other'
];

const COPING_STRATEGIES = [
  'Deep breathing',
  'Meditation/\nmindfulness',
  'Gentle exercise',
  'Talked to partner',
  'Talked to friend',
  'Support group',
  'Journaling',
  'Distraction activities',
  'Professional counseling',
  'None today'
];

const INFO_NEEDS = [
  'Medication side effects',
  'Success rates',
  'Next steps in treatment',
  'Financial options',
  'Alternative protocols',
  'Lifestyle factors',
  'Emotional support resources',
  'When to consider stopping'
];

export const EnhancedDailyCheckinForm: React.FC<EnhancedDailyCheckinFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Function to scroll to top with smooth animation
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Custom setCurrentStep that includes scroll-to-top
  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    // Use setTimeout to ensure DOM has updated before scrolling
    setTimeout(() => scrollToTop(), 50);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed PHQ-4 from Enhanced Daily Check-in - it should be a separate flow
  const [showResults, setShowResults] = useState(false);
  
  // Form state
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [anxietyLevel, setAnxietyLevel] = useState<number>(5);
  const [confidence, setConfidence] = useState<number>(5);
  const [hasInteractedWithConfidence, setHasInteractedWithConfidence] = useState(false);
  const [hasInteractedWithAnxiety, setHasInteractedWithAnxiety] = useState(false);
  const [hasInteractedWithInjection, setHasInteractedWithInjection] = useState(false);
  const [hasInteractedWithAppointment, setHasInteractedWithAppointment] = useState(false);
  const [tookMedications, setTookMedications] = useState<boolean | null>(null);
  const [missedDoses, setMissedDoses] = useState<number | ''>('');
  const [injectionConfidence, setInjectionConfidence] = useState<number>(7);
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [hasAppointment, setHasAppointment] = useState<boolean | null>(null);
  const [appointmentAnxiety, setAppointmentAnxiety] = useState<number>(5);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [partnerInvolved, setPartnerInvolved] = useState<boolean | null>(null);
  const [infoNeeds, setInfoNeeds] = useState<string[]>([]);
  const [userNote, setUserNote] = useState('');
  // PHQ-4 result state removed
  
  // Outcome predictions based on current data
  const [outcomePredictions, setOutcomePredictions] = useState<any>(null);
  
  // PHQ-4 check removed - should be handled separately from daily check-ins
  
  // Calculate outcome predictions based on inputs
  useEffect(() => {
    if (anxietyLevel && confidence && tookMedications !== null) {
      const predictions = {
        adherenceRisk: calculateAdherenceRisk(),
        completionProbability: calculateCompletionProbability(),
        supportNeeds: identifySupportNeeds()
      };
      setOutcomePredictions(predictions);
    }
  }, [anxietyLevel, confidence, tookMedications, selectedMood]);
  
  const calculateAdherenceRisk = () => {
    let risk = 0;
    if (anxietyLevel > 7) risk += 25;
    if (confidence < 4) risk += 20;
    if (typeof missedDoses === 'number' && missedDoses > 0) risk += 30;
    if (sideEffects.length > 3) risk += 15;
    return Math.min(risk, 90);
  };
  
  const calculateCompletionProbability = () => {
    let probability = 85; // baseline
    if (confidence >= 7) probability += 10;
    if (anxietyLevel <= 4) probability += 5;
    if (partnerInvolved) probability += 8;
    if (copingStrategies.length >= 2) probability += 7;
    return Math.min(probability, 98);
  };
  
  const identifySupportNeeds = () => {
    const needs = [];
    if (anxietyLevel > 7) needs.push('anxiety_management');
    if (confidence < 4) needs.push('confidence_building');
    if (sideEffects.length > 2) needs.push('side_effect_management');
    if (infoNeeds.length > 3) needs.push('information_session');
    return needs;
  };
  
  // PHQ-4 complete handler removed
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // For now, send only the fields the backend expects
      // Store enhanced data in localStorage for future use
      const enhancedData = {
        anxiety_level: anxietyLevel,
        took_all_medications: tookMedications || false,
        missed_doses: typeof missedDoses === 'number' ? missedDoses : 0,
        injection_confidence: injectionConfidence,
        side_effects: sideEffects,
        appointment_within_3_days: hasAppointment || false,
        appointment_anxiety: hasAppointment ? appointmentAnxiety : undefined,
        coping_strategies_used: copingStrategies,
        partner_involved_today: partnerInvolved,
        wish_knew_more_about: infoNeeds,
        // PHQ-4 scores removed from enhanced check-in
      };
      
      // Get today's date in user's local timezone
      const todayString = getLocalDateString();
      
      // Store enhanced data for the checklist to use
      localStorage.setItem(`enhanced_checkin_${user?.email}_${todayString}`, JSON.stringify(enhancedData));
      
      // Send ALL fields to backend (PostgreSQL handles everything now!)
      const checkinData = {
        // Basic fields
        mood_today: selectedMood,
        confidence_today: confidence,
        medication_taken: tookMedications === true ? 'yes' : tookMedications === false ? 'no' : 'not tracked',
        user_note: userNote,
        date_submitted: todayString,
        primary_concern_today: sideEffects.length > 0 ? 'medication_side_effects' : 
                              anxietyLevel > 7 ? 'anxiety_management' :
                              confidence < 4 ? 'confidence_building' : undefined,
        
        // Enhanced fields - no more localStorage only!
        anxiety_level: anxietyLevel,
        side_effects: sideEffects.length > 0 ? sideEffects : null,
        missed_doses: typeof missedDoses === 'number' ? missedDoses : null,
        injection_confidence: user?.cycle_stage === 'stimulation' ? injectionConfidence : null,
        appointment_within_3_days: hasAppointment,
        appointment_anxiety: hasAppointment ? appointmentAnxiety : null,
        coping_strategies_used: copingStrategies.length > 0 ? copingStrategies : null,
        partner_involved_today: partnerInvolved,
        wish_knew_more_about: infoNeeds.length > 0 ? infoNeeds : null,
        
        // PHQ-4 Assessment data
        // PHQ-4 scores removed from enhanced check-in
      };
      
      const response = await fetch(`${API_BASE_URL}/api/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(checkinData)
      });
      
      if (response.ok) {
        setShowResults(true);
        
        // Call onComplete immediately after successful submission
        // This ensures the parent component knows the checkin is complete
        if (onComplete) {
          onComplete();
        }
        
        trackCheckinSubmitted({
          user_id: user?.id || '',
          mood_score: ENHANCED_MOOD_OPTIONS.findIndex(m => m.mood === selectedMood) + 1,
          symptom_flags: sideEffects,
          time_to_complete_ms: Date.now() - startTime
        });
        
        setShowResults(true);
        // User stays on success page - no auto-redirect
      } else {
        throw new Error('Failed to submit check-in');
      }
    } catch (error) {
      console.error('Check-in submission error:', error);
      alert('Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const [startTime] = useState(Date.now());
  
  const totalSteps = 4; // Enhanced check-in has 4 steps
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  // PHQ-4 removed from Enhanced Daily Check-in flow
  
  if (showResults) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Check-in Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Your Treatment Outlook
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded p-3 text-center">
                <p className="text-xs text-green-600 font-medium h-8 flex items-center justify-center">Treatment<br />Engagement</p>
                <p className="text-2xl font-bold text-green-800 mt-2">
                  {outcomePredictions?.completionProbability > 85 ? 'High' : 
                   outcomePredictions?.completionProbability > 70 ? 'Good' : 'Building'}
                </p>
              </div>
              <div className={`rounded p-3 text-center ${
                outcomePredictions?.adherenceRisk > 50 ? 'bg-orange-50' : 'bg-blue-50'
              }`}>
                <p className="text-xs text-gray-600 font-medium h-8 flex items-center justify-center">Support<br />Opportunities</p>
                <p className={`text-2xl font-bold mt-2 ${
                  outcomePredictions?.adherenceRisk > 50 ? 'text-orange-800' : 'text-blue-800'
                }`}>
                  {outcomePredictions?.adherenceRisk > 50 ? 'Available' : 'On Track'}
                </p>
              </div>
            </div>
            
            {outcomePredictions?.supportNeeds.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 rounded">
                <p className="text-sm text-purple-800">
                  <strong>Personalized support:</strong> Based on your check-in, you may find these resources helpful:{' '}
                  {outcomePredictions.supportNeeds.map((need: string) => 
                    need.replace('_', ' ').replace('anxiety management', 'stress reduction techniques')
                                         .replace('confidence building', 'confidence boosters')
                                         .replace('side effect management', 'comfort strategies')
                                         .replace('information session', 'educational resources')
                  ).join(', ')}.
                </p>
              </div>
            )}
          </div>
          
          <p className="text-center text-gray-600">
            Your insights are being personalized based on your check-in data...
          </p>
          
          <Button 
            onClick={() => {
              // Just close the results view - onComplete was already called
              setShowResults(false);
              handleStepChange(1);
              setSelectedMood('');
              setAnxietyLevel(5);
              setConfidence(5);
              setHasInteractedWithConfidence(false);
              setHasInteractedWithAnxiety(false);
            }}
            className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 mt-4"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-purple-800">
            <Heart className="h-5 w-5" />
            Enhanced Daily Check-in
          </span>
          <span className="text-sm font-normal text-purple-600">
            Step {currentStep} of {totalSteps}
          </span>
        </CardTitle>
        <Progress value={progressPercentage} className="h-2 bg-purple-100" />
      </CardHeader>
      
      <CardContent>
        {/* Step 1: Mood & Anxiety */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <MetricTooltip metric="mood">
                <Label className="text-base font-semibold mb-3 block">
                  How are you feeling today? (Select your primary mood)
                </Label>
              </MetricTooltip>
              <div className="grid grid-cols-2 gap-2">
                {ENHANCED_MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.mood}
                    onClick={() => setSelectedMood(option.mood)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMood === option.mood
                        ? 'border-purple-500 bg-purple-100 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-purple-600 italic">{option.supportMessage}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <MetricTooltip metric="anxiety">
                <Label className="text-base font-semibold mb-3 block">
                  Current anxiety level
                </Label>
              </MetricTooltip>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Calm</span>
                  <span>Very anxious</span>
                </div>
                <UnifiedSlider
                  value={anxietyLevel}
                  onChange={(value) => {
                    setAnxietyLevel(value);
                    setHasInteractedWithAnxiety(true);
                  }}
                  hasInteracted={hasInteractedWithAnxiety}
                  className="mt-2"
                  variant="centered"
                  showValue={true}
                />
                {hasInteractedWithAnxiety && anxietyLevel > 7 && (
                  <p className="text-sm text-purple-600 mt-2 italic">
                    We're here to support you with coping strategies
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => handleStepChange(2)}
              disabled={!selectedMood}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
            >
              Continue
            </Button>
          </div>
        )}
        
        {/* Step 2: Medication & Side Effects */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <MetricTooltip metric="medication">
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medication Tracking
                </Label>
              </MetricTooltip>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="font-medium mb-3">Did you take all scheduled medications today?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={tookMedications === true ? 'default' : 'outline'}
                      onClick={() => {
                        setTookMedications(true);
                        setMissedDoses('');
                      }}
                      className="flex-1 h-auto py-3"
                    >
                      <span className="text-lg mr-2">✅</span>
                      Yes, all doses
                    </Button>
                    <Button
                      variant={tookMedications === false ? 'default' : 'outline'}
                      onClick={() => setTookMedications(false)}
                      className="flex-1 h-auto py-3"
                    >
                      <span className="text-lg mr-2">⚠️</span>
                      Missed some
                    </Button>
                  </div>
                  
                  {tookMedications === false && (
                    <div className="mt-3">
                      <Label>How many doses missed?</Label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={missedDoses}
                        onChange={(e) => setMissedDoses(e.target.value ? Number(e.target.value) : '')}
                        className="w-full mt-1 p-2 border rounded"
                        placeholder="Enter number"
                      />
                    </div>
                  )}
                </div>
                
                {user?.cycle_stage === 'stimulation' && (
                  <div>
                    <Label className="mb-2 block">Injection confidence level</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                      <UnifiedSlider
                        value={injectionConfidence}
                        onChange={(value) => {
                          setInjectionConfidence(value);
                          setHasInteractedWithInjection(true);
                        }}
                        hasInteracted={hasInteractedWithInjection}
                        className="mt-2"
                        variant="centered"
                        showValue={true}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="mb-2 block">Any side effects today?</Label>
                  <div className="grid grid-cols-2 gap-3 side-effects-grid">
                    {SIDE_EFFECTS_OPTIONS.map((effect) => (
                      <label
                        key={effect}
                        className={`flex items-center justify-center min-h-[60px] p-3 rounded-lg border cursor-pointer text-sm text-center ${
                          sideEffects.includes(effect)
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sideEffects.includes(effect)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSideEffects([...sideEffects, effect]);
                            } else {
                              setSideEffects(sideEffects.filter(s => s !== effect));
                            }
                          }}
                          className="sr-only"
                        />
                        <span>{effect}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => handleStepChange(3)}
              disabled={tookMedications === null}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
            >
              Continue
            </Button>
          </div>
        )}
        
        {/* Step 3: Support & Coping */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Support & Coping
              </Label>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2 text-sm sm:text-base">Appointment in next 3 days?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={hasAppointment === true ? 'default' : 'outline'}
                      onClick={() => setHasAppointment(true)}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={hasAppointment === false ? 'default' : 'outline'}
                      onClick={() => setHasAppointment(false)}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                  
                  {hasAppointment && (
                    <div className="mt-3">
                      <Label className="mb-2 block">Pre-appointment anxiety level</Label>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Calm</span>
                          <span>Anxious</span>
                        </div>
                        <UnifiedSlider
                          value={appointmentAnxiety}
                          onChange={(value) => {
                            setAppointmentAnxiety(value);
                            setHasInteractedWithAppointment(true);
                          }}
                          hasInteracted={hasInteractedWithAppointment}
                          className="mt-2"
                          variant="centered"
                          showValue={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="mb-2 block">What coping strategies did you use today?</Label>
                  <div className="grid grid-cols-2 gap-3 coping-strategies-grid">
                    {COPING_STRATEGIES.map((strategy) => (
                      <label
                        key={strategy}
                        className={`flex items-center justify-center min-h-[80px] p-3 rounded-lg border cursor-pointer text-sm text-center ${
                          copingStrategies.includes(strategy)
                            ? 'bg-green-50 border-green-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={copingStrategies.includes(strategy)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCopingStrategies([...copingStrategies, strategy]);
                            } else {
                              setCopingStrategies(copingStrategies.filter(s => s !== strategy));
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="whitespace-pre-line">{strategy}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <p className="font-medium mb-2">Was your partner/support person involved today?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={partnerInvolved === true ? 'default' : 'outline'}
                      onClick={() => setPartnerInvolved(true)}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={partnerInvolved === false ? 'default' : 'outline'}
                      onClick={() => setPartnerInvolved(false)}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => handleStepChange(4)}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
            >
              Continue
            </Button>
          </div>
        )}
        
        {/* Step 4: Information Needs & Notes */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                What would you like to know more about?
              </Label>
              <div className="grid grid-cols-2 gap-3 info-needs-grid">
                {INFO_NEEDS.map((need) => (
                  <label
                    key={need}
                    className={`flex items-center justify-center min-h-[80px] p-3 rounded-lg border cursor-pointer text-sm text-center ${
                      infoNeeds.includes(need)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={infoNeeds.includes(need)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInfoNeeds([...infoNeeds, need]);
                        } else {
                          setInfoNeeds(infoNeeds.filter(n => n !== need));
                        }
                      }}
                      className="sr-only"
                    />
                    <span>{need}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <MetricTooltip metric="confidence">
                <Label className="text-base font-semibold mb-2 block">
                  Overall confidence today
                </Label>
              </MetricTooltip>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Low</span>
                  <span>High</span>
                </div>
                <UnifiedSlider
                  value={confidence}
                  onChange={(value) => {
                    setConfidence(value);
                    setHasInteractedWithConfidence(true);
                  }}
                  hasInteracted={hasInteractedWithConfidence}
                  className="mt-2"
                  variant="centered"
                  showValue={true}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                Any additional notes? (Optional)
              </Label>
              <Textarea
                id="notes"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Anything else you'd like to track or remember..."
                className="min-h-[80px]"
              />
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Complete Check-in'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};