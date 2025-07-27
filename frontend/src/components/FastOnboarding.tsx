import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { trackOnboardingCompletion, OnboardingContext } from '../utils/speedTapDetection';

interface FastOnboardingData {
  email: string;
  cycle_stage: string;
  primary_concern: string;
}

interface FastOnboardingProps {
  onComplete: (data: FastOnboardingData, context: OnboardingContext) => void;
  onBack: () => void;
  initialData?: Partial<FastOnboardingData>;
  startTime: number;
}

const CYCLE_STAGES = [
  { value: 'ivf_prep', label: 'Preparing for IVF' },
  { value: 'ivf_active', label: 'Currently in IVF cycle' },
  { value: 'post_ivf', label: 'Post-IVF treatment' },
  { value: 'considering', label: 'Considering IVF' }
];

const PRIMARY_CONCERNS = [
  { value: 'medical_clarity', label: 'Medical clarity and understanding' },
  { value: 'financial_costs', label: 'Financial costs and insurance' },
  { value: 'emotional_support', label: 'Emotional support and mental health' },
  { value: 'logistics', label: 'Logistics and scheduling' }
];

export const FastOnboarding: React.FC<FastOnboardingProps> = ({
  onComplete,
  onBack,
  initialData = {},
  startTime
}) => {
  const [formData, setFormData] = useState<FastOnboardingData>({
    email: initialData.email || '',
    cycle_stage: initialData.cycle_stage || '',
    primary_concern: initialData.primary_concern || ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const validationRules = [
    {
      field: 'email' as keyof FastOnboardingData,
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    {
      field: 'cycle_stage' as keyof FastOnboardingData,
      required: true,
      options: CYCLE_STAGES.map(stage => stage.value),
      message: 'Please select your current stage'
    },
    {
      field: 'primary_concern' as keyof FastOnboardingData,
      required: true,
      options: PRIMARY_CONCERNS.map(concern => concern.value),
      message: 'Please select your biggest concern'
    }
  ];

  const validate = (): boolean => {
    const newErrors: string[] = [];

    for (const rule of validationRules) {
      const value = formData[rule.field];

      if (rule.required && !value) {
        newErrors.push(rule.message);
        continue;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        newErrors.push(rule.message);
        continue;
      }

      if (rule.options && !rule.options.includes(value)) {
        newErrors.push(rule.message);
        continue;
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const completionTime = Date.now() - startTime;
      
      // Track completion analytics
      trackOnboardingCompletion({
        path: 'fast',
        completionMs: completionTime,
        stepsCompleted: 3,
        totalSteps: 3,
        fieldsCompleted: Object.keys(formData)
      });

      // Create onboarding context
      const context: OnboardingContext = {
        path: 'fast',
        triggerReason: 'speed_tap',
        completionMs: completionTime,
        stepsCompleted: 3,
        tapCount: 0, // Will be set by parent component
        timeWindowMs: 10000
      };

      onComplete(formData, context);
    } catch (error) {
      console.error('Fast onboarding completion error:', error);
      setErrors(['An error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FastOnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors.length > 0) {
      setErrors(prev => prev.filter(error => 
        !validationRules.find(rule => rule.field === field)?.message.includes(error)
      ));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Short on time? No problem!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Just give us the basics and we'll get you started quickly.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full"
                required
              />
            </div>

            {/* Cycle Stage Field */}
            <div className="space-y-2">
              <Label htmlFor="cycle_stage" className="text-sm font-medium text-gray-700">
                Where are you in your IVF journey? *
              </Label>
              <Select
                value={formData.cycle_stage}
                onValueChange={(value) => handleInputChange('cycle_stage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your current stage" />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Primary Concern Field */}
            <div className="space-y-2">
              <Label htmlFor="primary_concern" className="text-sm font-medium text-gray-700">
                What's your biggest concern right now? *
              </Label>
              <Select
                value={formData.primary_concern}
                onValueChange={(value) => handleInputChange('primary_concern', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary concern" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_CONCERNS.map((concern) => (
                    <SelectItem key={concern.value} value={concern.value}>
                      {concern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-600">
                  {errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-novara-coral to-novara-lavender text-white hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? 'Setting up your account...' : 'Get Started'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full"
              >
                Back to full onboarding
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="text-center text-sm text-gray-500">
              <div className="flex justify-center space-x-1 mb-2">
                <div className="w-2 h-2 bg-novara-coral rounded-full"></div>
                <div className="w-2 h-2 bg-novara-coral rounded-full"></div>
                <div className="w-2 h-2 bg-novara-coral rounded-full"></div>
              </div>
              <span>Fast path • 3 of 3 steps</span>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}; 