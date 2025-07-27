import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface OnboardingFastData {
  email: string;
  cycle_stage: string;
  primary_concern: string;
}

interface OnboardingFastProps {
  onComplete: (data: OnboardingFastData) => void;
  onBack: () => void;
  initialData?: Partial<OnboardingFastData>;
}

const CYCLE_STAGES = [
  { value: 'considering', label: 'Just considering IVF' },
  { value: 'ivf_prep', label: 'Preparing for IVF' },
  { value: 'stimulation', label: 'In stimulation phase' },
  { value: 'retrieval', label: 'Around retrieval' },
  { value: 'transfer', label: 'Transfer stage' },
  { value: 'tww', label: 'Two-week wait' },
  { value: 'pregnant', label: 'Pregnant' },
  { value: 'between_cycles', label: 'Between cycles' }
];

const PRIMARY_CONCERNS = [
  { value: 'emotional_support', label: 'Emotional support' },
  { value: 'medication_guidance', label: 'Medication guidance' },
  { value: 'financial_planning', label: 'Financial planning' },
  { value: 'procedure_info', label: 'Procedure information' },
  { value: 'community', label: 'Community connection' }
];

export const OnboardingFast: React.FC<OnboardingFastProps> = ({
  onComplete,
  onBack,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<OnboardingFastData>({
    email: initialData.email || '',
    cycle_stage: initialData.cycle_stage || '',
    primary_concern: initialData.primary_concern || ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const validationRules = [
    {
      field: 'email' as keyof OnboardingFastData,
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    {
      field: 'cycle_stage' as keyof OnboardingFastData,
      required: true,
      options: CYCLE_STAGES.map(stage => stage.value),
      message: 'Please select your current stage'
    },
    {
      field: 'primary_concern' as keyof OnboardingFastData,
      required: true,
      options: PRIMARY_CONCERNS.map(concern => concern.value),
      message: 'Please select your primary concern'
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
      onComplete(formData);
    } catch (error) {
      console.error('Fast onboarding completion error:', error);
      setErrors(['An error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof OnboardingFastData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors.length > 0) {
      setErrors(prev => prev.filter(error => 
        !validationRules.find(rule => rule.field === field)?.message.includes(error)
      ));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-gray-800">
          Quick Start ⚡
        </CardTitle>
        <CardDescription className="text-gray-600">
          Get started quickly! We'll collect additional details after your first check-in.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full border-[#FF6F61]/30 focus:border-[#FF6F61]"
              required
            />
          </div>

          {/* Cycle Stage Field */}
          <div className="space-y-2">
            <Label htmlFor="cycle_stage" className="text-sm font-medium text-gray-700">
              Where are you in your journey? *
            </Label>
            <Select
              value={formData.cycle_stage}
              onValueChange={(value) => handleInputChange('cycle_stage', value)}
            >
              <SelectTrigger className="border-[#FF6F61]/30 focus:border-[#FF6F61]">
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
              What would be most helpful right now? *
            </Label>
            <Select
              value={formData.primary_concern}
              onValueChange={(value) => handleInputChange('primary_concern', value)}
            >
              <SelectTrigger className="border-[#FF6F61]/30 focus:border-[#FF6F61]">
                <SelectValue placeholder="Choose your primary need" />
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
          <div className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
            >
              {isSubmitting ? 'Getting started...' : 'Start My Journey'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full text-gray-600"
            >
              I'd prefer the complete setup
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <div className="flex justify-center space-x-1 mb-1">
              <div className="w-1.5 h-1.5 bg-[#FF6F61] rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-[#FF6F61] rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-[#FF6F61] rounded-full"></div>
            </div>
            <span>Quick setup</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 