import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

import { X } from 'lucide-react';
import { trackBaselineCompleted } from '../utils/abTestUtils';

interface BaselineData {
  nickname: string;
  confidence_meds: number;
  confidence_costs: number;
  confidence_overall: number;
  top_concern: string;
}

interface BaselinePanelProps {
  onComplete: (data: BaselineData) => void;
  onClose?: () => void;
  userEmail: string;
  sessionId: string;
  startTime: number;
}

export const BaselinePanel: React.FC<BaselinePanelProps> = ({
  onComplete,
  onClose,
  userEmail,
  sessionId,
  startTime
}) => {
  const [formData, setFormData] = useState<BaselineData>({
    nickname: userEmail.split('@')[0], // Default to email prefix
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    top_concern: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Questions that weren't collected in the fast onboarding
  const questions = [
    {
      id: 'nickname',
      title: 'What should we call you?',
      description: 'A name or nickname that feels comfortable',
      type: 'text' as const
    },
    {
      id: 'confidence_meds',
      title: 'How prepared do you feel about IVF medications?',
      description: 'This helps us personalize your insights',
      type: 'slider' as const,
      min: 1,
      max: 10,
      labels: { min: 'Very lost', max: 'Totally prepared' }
    },
    {
      id: 'confidence_costs',
      title: 'How confident are you about costs and insurance?',
      description: 'Understanding your financial concerns',
      type: 'slider' as const,
      min: 1,
      max: 10,
      labels: { min: 'In the dark', max: 'On top of it' }
    },
    {
      id: 'confidence_overall',
      title: 'How confident do you feel about your overall IVF journey?',
      description: 'Your general sense of readiness and understanding',
      type: 'slider' as const,
      min: 1,
      max: 10,
      labels: { min: 'Completely overwhelmed', max: 'Ready and confident' }
    },
    {
      id: 'top_concern',
      title: 'What\'s your biggest worry right now?',
      description: 'Optional - helps us provide more targeted support',
      type: 'text' as const,
      optional: true
    }
  ];

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const completionTime = Date.now() - startTime;
      
      // Track baseline completion
      trackBaselineCompleted({
        completion_ms: completionTime,
        user_id: userEmail,
        session_id: sessionId
      });

      onComplete(formData);
    } catch (error) {
      console.error('Baseline panel completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BaselineData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderQuestionContent = () => {
    switch (currentQ.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <Input
              value={formData[currentQ.id as keyof BaselineData] as string}
              onChange={(e) => handleInputChange(currentQ.id as keyof BaselineData, e.target.value)}
              placeholder={currentQ.id === 'nickname' ? 'Your preferred name' : 'Share your thoughts...'}
              className="text-lg p-4 border-[#FF6F61]/30 focus:border-[#FF6F61]"
              autoFocus
            />
            {currentQ.optional && (
              <p className="text-xs text-gray-500 text-center">
                This is optional - you can skip if you prefer
              </p>
            )}
          </div>
        );

      case 'slider':
        const value = formData[currentQ.id as keyof BaselineData] as number;
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#FF6F61] mb-2">
                {value}/10
              </div>
            </div>
            
            <div className="px-4">
              <input
                type="range"
                min={currentQ.min}
                max={currentQ.max}
                value={value}
                onChange={(e) => handleInputChange(currentQ.id as keyof BaselineData, parseInt(e.target.value))}
                className="w-full h-3 cursor-pointer rounded-lg appearance-none outline-none"
                style={{
                  background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((value - (currentQ.min || 1)) / ((currentQ.max || 10) - (currentQ.min || 1))) * 100}%, #e5e7eb ${((value - (currentQ.min || 1)) / ((currentQ.max || 10) - (currentQ.min || 1))) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{currentQ.labels?.min}</span>
                <span>{currentQ.labels?.max}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <CardTitle className="text-xl font-bold text-gray-800">
            Almost done! 🎯
          </CardTitle>
          <CardDescription className="text-gray-600">
            Just a few more details to personalize your experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index <= currentQuestion ? 'bg-[#FF6F61]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentQ.title}
            </h3>
            <p className="text-sm text-gray-600">
              {currentQ.description}
            </p>
          </div>

          {/* Question Content */}
          <div className="py-4">
            {renderQuestionContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentQuestion > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`${currentQuestion === 0 ? 'w-full' : 'flex-1'} bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white`}
            >
              {isSubmitting ? 'Completing...' : isLastQuestion ? 'Complete Setup' : 'Next'}
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="text-center text-xs text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 