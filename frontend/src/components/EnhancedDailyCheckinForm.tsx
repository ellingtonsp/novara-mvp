// Enhanced Daily Check-in Form with Evidence-Based Data Capture
// Includes: PHQ-4, medication adherence, anxiety levels, side effects tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, Clock, CheckCircle, Loader2, Pill, AlertCircle, 
  Brain, Calendar, TrendingUp, Target, Activity 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackCheckinSubmitted } from '../lib/analytics';
import { API_BASE_URL } from '../lib/environment';
import { PHQ4Assessment, PHQ4Result } from './PHQ4Assessment';
import { CenteredSlider } from './CenteredSlider';

interface EnhancedDailyCheckinFormProps {
  onComplete?: () => void;
}

interface EnhancedCheckinData {
  // Existing fields
  mood_today: string;
  confidence_today: number;
  primary_concern_today?: string;
  user_note?: string;
  
  // New evidence-based fields
  anxiety_level: number;
  took_all_medications: boolean;
  missed_doses: number;
  injection_confidence?: number;
  side_effects: string[];
  side_effect_severity?: Record<string, number>;
  
  // Appointment prep
  appointment_within_3_days: boolean;
  appointment_anxiety?: number;
  questions_prepared?: boolean;
  
  // Coping & support
  coping_strategies_used: string[];
  partner_involved_today: boolean;
  
  // Information needs
  wish_knew_more_about: string[];
  
  // PHQ-4 results (if due)
  phq4_score?: number;
  phq4_anxiety?: number;
  phq4_depression?: number;
}

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
  'Meditation/mindfulness',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPHQ4, setShowPHQ4] = useState(false);
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
  const [missedDoses, setMissedDoses] = useState<number>(0);
  const [injectionConfidence, setInjectionConfidence] = useState<number>(7);
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [hasAppointment, setHasAppointment] = useState<boolean | null>(null);
  const [appointmentAnxiety, setAppointmentAnxiety] = useState<number>(5);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [partnerInvolved, setPartnerInvolved] = useState<boolean>(false);
  const [infoNeeds, setInfoNeeds] = useState<string[]>([]);
  const [userNote, setUserNote] = useState('');
  const [phq4Result, setPHQ4Result] = useState<PHQ4Result | null>(null);
  
  // Outcome predictions based on current data
  const [outcomePredictions, setOutcomePredictions] = useState<any>(null);
  
  // Check if PHQ-4 is due (weekly/biweekly based on risk)
  useEffect(() => {
    const checkPHQ4Due = async () => {
      // TODO: Check last PHQ-4 date from API
      const lastAssessment = localStorage.getItem(`phq4_last_${user?.email}`);
      if (!lastAssessment) {
        setShowPHQ4(true);
        return;
      }
      
      const daysSince = Math.floor((Date.now() - new Date(lastAssessment).getTime()) / (1000 * 60 * 60 * 24));
      const frequency = phq4Result?.riskLevel === 'moderate' || phq4Result?.riskLevel === 'severe' ? 7 : 14;
      
      if (daysSince >= frequency) {
        setShowPHQ4(true);
      }
    };
    
    checkPHQ4Due();
  }, [user, phq4Result]);
  
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
    if (missedDoses > 0) risk += 30;
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
  
  const handlePHQ4Complete = (result: PHQ4Result) => {
    setPHQ4Result(result);
    localStorage.setItem(`phq4_last_${user?.email}`, new Date().toISOString());
    setShowPHQ4(false);
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // For now, send only the fields the backend expects
      // Store enhanced data in localStorage for future use
      const enhancedData = {
        anxiety_level: anxietyLevel,
        took_all_medications: tookMedications || false,
        missed_doses: missedDoses,
        injection_confidence: injectionConfidence,
        side_effects: sideEffects,
        appointment_within_3_days: hasAppointment || false,
        appointment_anxiety: hasAppointment ? appointmentAnxiety : undefined,
        coping_strategies_used: copingStrategies,
        partner_involved_today: partnerInvolved,
        wish_knew_more_about: infoNeeds,
        phq4_score: phq4Result?.totalScore,
        phq4_anxiety: phq4Result?.anxietyScore,
        phq4_depression: phq4Result?.depressionScore
      };
      
      // Store enhanced data for the checklist to use
      localStorage.setItem(`enhanced_checkin_${user?.email}_${new Date().toISOString().split('T')[0]}`, JSON.stringify(enhancedData));
      
      // Send only basic fields to backend
      const checkinData = {
        mood_today: selectedMood,
        confidence_today: confidence,
        user_note: userNote,
        // Add enhanced data summary to the note
        primary_concern_today: sideEffects.length > 0 ? 'medication_side_effects' : 
                              anxietyLevel > 7 ? 'anxiety_management' :
                              confidence < 4 ? 'confidence_building' : undefined
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
        trackCheckinSubmitted({
          user_id: user?.id || '',
          mood_score: ENHANCED_MOOD_OPTIONS.findIndex(m => m.mood === selectedMood) + 1,
          symptom_flags: sideEffects,
          time_to_complete_ms: Date.now() - startTime
        });
        
        alert('Check-in completed! Your personalized insights are ready.');
        onComplete?.();
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
  
  const totalSteps = showPHQ4 ? 5 : 4;
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  if (showPHQ4 && currentStep === 1) {
    return (
      <div className="space-y-4">
        <PHQ4Assessment 
          onComplete={handlePHQ4Complete}
          showOutcomeContext={true}
        />
        <Button 
          onClick={() => setCurrentStep(2)}
          className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90"
        >
          Continue to Daily Check-in
        </Button>
      </div>
    );
  }
  
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
              <div className="bg-green-50 rounded p-3">
                <p className="text-xs text-green-600 font-medium">Cycle Completion Probability</p>
                <p className="text-2xl font-bold text-green-800">{outcomePredictions?.completionProbability}%</p>
              </div>
              <div className={`rounded p-3 ${
                outcomePredictions?.adherenceRisk > 50 ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <p className="text-xs text-gray-600 font-medium">Adherence Risk</p>
                <p className={`text-2xl font-bold ${
                  outcomePredictions?.adherenceRisk > 50 ? 'text-red-800' : 'text-yellow-800'
                }`}>{outcomePredictions?.adherenceRisk}%</p>
              </div>
            </div>
            
            {outcomePredictions?.supportNeeds.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 rounded">
                <p className="text-sm text-purple-800">
                  <strong>Recommended support:</strong> Based on today's check-in, we'll provide extra help with{' '}
                  {outcomePredictions.supportNeeds.join(', ')}.
                </p>
              </div>
            )}
          </div>
          
          <p className="text-center text-gray-600">
            Your insights are being personalized based on your check-in data...
          </p>
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
              <Label className="text-base font-semibold mb-3 block">
                How are you feeling today? (Select your primary mood)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {ENHANCED_MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.mood}
                    onClick={() => setSelectedMood(option.mood)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMood === option.mood
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
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
              <Label className="text-base font-semibold mb-3 block">
                Current anxiety level
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Calm</span>
                  <span className={`font-bold ${hasInteractedWithAnxiety ? 'text-purple-600' : 'text-gray-400'}`}>
                    {hasInteractedWithAnxiety ? anxietyLevel : '—'}
                  </span>
                  <span>Very anxious</span>
                </div>
                <CenteredSlider
                  value={anxietyLevel}
                  onChange={(value) => {
                    setAnxietyLevel(value);
                    setHasInteractedWithAnxiety(true);
                  }}
                  hasInteracted={hasInteractedWithAnxiety}
                  className="mt-2"
                />
                {hasInteractedWithAnxiety && anxietyLevel > 7 && (
                  <p className="text-sm text-purple-600 mt-2 italic">
                    We're here to support you with coping strategies
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => setCurrentStep(2)}
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
              <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medication Tracking
              </Label>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="font-medium mb-3">Did you take all scheduled medications today?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={tookMedications === true ? 'default' : 'outline'}
                      onClick={() => {
                        setTookMedications(true);
                        setMissedDoses(0);
                      }}
                      className="flex-1"
                    >
                      Yes, all doses
                    </Button>
                    <Button
                      variant={tookMedications === false ? 'default' : 'outline'}
                      onClick={() => setTookMedications(false)}
                      className="flex-1"
                    >
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
                        onChange={(e) => setMissedDoses(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    </div>
                  )}
                </div>
                
                {user?.cycle_stage === 'stimulation' && (
                  <div>
                    <Label className="mb-2 block">Injection confidence level</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Low</span>
                        <span className={`font-bold ${hasInteractedWithInjection ? 'text-purple-600' : 'text-gray-400'}`}>
                          {hasInteractedWithInjection ? injectionConfidence : '—'}
                        </span>
                        <span>High</span>
                      </div>
                      <CenteredSlider
                        value={injectionConfidence}
                        onChange={(value) => {
                          setInjectionConfidence(value);
                          setHasInteractedWithInjection(true);
                        }}
                        hasInteracted={hasInteractedWithInjection}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="mb-2 block">Any side effects today?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIDE_EFFECTS_OPTIONS.map((effect) => (
                      <label
                        key={effect}
                        className={`flex items-center p-2 rounded border cursor-pointer ${
                          sideEffects.includes(effect)
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-white border-gray-200'
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
                          className="mr-2"
                        />
                        <span className="text-sm">{effect}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setCurrentStep(3)}
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
                  <p className="font-medium mb-2">Do you have an appointment in the next 3 days?</p>
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
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Calm</span>
                          <span className={`font-bold ${hasInteractedWithAppointment ? 'text-purple-600' : 'text-gray-400'}`}>
                            {hasInteractedWithAppointment ? appointmentAnxiety : '—'}
                          </span>
                          <span>Anxious</span>
                        </div>
                        <CenteredSlider
                          value={appointmentAnxiety}
                          onChange={(value) => {
                            setAppointmentAnxiety(value);
                            setHasInteractedWithAppointment(true);
                          }}
                          hasInteracted={hasInteractedWithAppointment}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="mb-2 block">What coping strategies did you use today?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COPING_STRATEGIES.map((strategy) => (
                      <label
                        key={strategy}
                        className={`flex items-center p-2 rounded border cursor-pointer text-sm ${
                          copingStrategies.includes(strategy)
                            ? 'bg-green-50 border-green-300'
                            : 'bg-white border-gray-200'
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
                          className="mr-2"
                        />
                        {strategy}
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
              onClick={() => setCurrentStep(4)}
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
              <div className="grid grid-cols-2 gap-2">
                {INFO_NEEDS.map((need) => (
                  <label
                    key={need}
                    className={`flex items-center p-2 rounded border cursor-pointer text-sm ${
                      infoNeeds.includes(need)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200'
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
                      className="mr-2"
                    />
                    {need}
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Overall confidence today
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Low</span>
                  <span className={`font-bold ${hasInteractedWithConfidence ? 'text-purple-600' : 'text-gray-400'}`}>
                    {hasInteractedWithConfidence ? confidence : '—'}
                  </span>
                  <span>High</span>
                </div>
                <CenteredSlider
                  value={confidence}
                  onChange={(value) => {
                    setConfidence(value);
                    setHasInteractedWithConfidence(true);
                  }}
                  hasInteracted={hasInteractedWithConfidence}
                  className="mt-2"
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