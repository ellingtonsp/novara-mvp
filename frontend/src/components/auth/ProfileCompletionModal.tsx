import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { AlertCircle, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: () => void;
}

const CYCLE_STAGES = [
  { value: 'ivf_prep', label: 'Preparing for IVF' },
  { value: 'ivf_active', label: 'Currently in IVF cycle' },
  { value: 'post_ivf', label: 'Post-IVF treatment' },
  { value: 'considering', label: 'Considering IVF' }
];

const PRIMARY_NEEDS = [
  { value: 'medical_clarity', label: 'Medical clarity and understanding' },
  { value: 'financial_costs', label: 'Financial costs and insurance' },
  { value: 'emotional_support', label: 'Emotional support and mental health' },
  { value: 'logistics', label: 'Logistics and scheduling' }
];

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    cycle_stage: user?.cycle_stage || '',
    primary_need: user?.primary_need || '',
    confidence_meds: user?.confidence_meds || 5,
    confidence_costs: user?.confidence_costs || 5,
    confidence_overall: user?.confidence_overall || 5
  });

  if (!isOpen || !user) return null;

  const steps = [
    {
      id: 'welcome',
      title: 'Complete Your Profile',
      description: 'Just a few quick questions to personalize your experience',
      fields: []
    },
    {
      id: 'journey',
      title: 'Your IVF Journey',
      description: 'Help us understand where you are in your journey',
      fields: ['cycle_stage', 'primary_need']
    },
    {
      id: 'confidence',
      title: 'Your Confidence Levels',
      description: 'How are you feeling about different aspects?',
      fields: ['confidence_meds', 'confidence_costs', 'confidence_overall']
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    // Validate current step
    const currentFields = currentStepData.fields;
    const stepErrors: string[] = [];

    if (currentFields.includes('cycle_stage') && !formData.cycle_stage) {
      stepErrors.push('Please select your current stage');
    }
    if (currentFields.includes('primary_need') && !formData.primary_need) {
      stepErrors.push('Please select your primary need');
    }

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Update user profile
      const response = await api.put('/users/me', {
        ...formData,
        baseline_completed: true
      });

      if (response.data.success) {
        // Update local user state
        updateUser(response.data.user);
        onComplete();
      }
    } catch (error: any) {
      setErrors([error.response?.data?.error || 'Failed to update profile']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-[#FF6F61]/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-[#FF6F61]" />
            </div>
            <p className="text-gray-600">
              Welcome! Since you signed in with {user.email.includes('@privaterelay.appleid.com') ? 'Apple' : 'your social account'}, 
              we need a few details to personalize your fertility journey experience.
            </p>
            <p className="text-sm text-gray-500">
              This will only take a minute and helps us provide relevant insights.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle_stage">Where are you in your fertility journey?</Label>
              <Select
                value={formData.cycle_stage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cycle_stage: value }))}
              >
                <SelectTrigger id="cycle_stage">
                  <SelectValue placeholder="Select your current stage" />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_STAGES.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_need">What's your biggest need right now?</Label>
              <Select
                value={formData.primary_need}
                onValueChange={(value) => setFormData(prev => ({ ...prev, primary_need: value }))}
              >
                <SelectTrigger id="primary_need">
                  <SelectValue placeholder="Select your primary concern" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_NEEDS.map(need => (
                    <SelectItem key={need.value} value={need.value}>
                      {need.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">What should we call you? (optional)</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder={user.nickname || 'Your nickname'}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>How prepared do you feel about IVF medications?</Label>
                <span className="text-sm font-medium text-gray-700">{formData.confidence_meds}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.confidence_meds}
                onChange={(e) => setFormData(prev => ({ ...prev, confidence_meds: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very lost</span>
                <span>Totally prepared</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>How confident are you about costs and insurance?</Label>
                <span className="text-sm font-medium text-gray-700">{formData.confidence_costs}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.confidence_costs}
                onChange={(e) => setFormData(prev => ({ ...prev, confidence_costs: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>In the dark</span>
                <span>On top of it</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Overall, how confident do you feel?</Label>
                <span className="text-sm font-medium text-gray-700">{formData.confidence_overall}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.confidence_overall}
                onChange={(e) => setFormData(prev => ({ ...prev, confidence_overall: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Overwhelmed</span>
                <span>Ready & confident</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
          
          {/* Progress indicator */}
          <div className="flex space-x-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStep ? 'bg-[#FF6F61]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm space-y-1">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}

          {renderStepContent()}

          <div className="flex justify-between pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`${currentStep === 0 ? 'w-full' : 'ml-auto'} bg-[#FF6F61] hover:bg-[#FF6F61]/90`}
            >
              {isSubmitting ? 'Saving...' : (
                currentStep === steps.length - 1 ? 'Complete Profile' : 'Next'
              )}
              {!isSubmitting && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};