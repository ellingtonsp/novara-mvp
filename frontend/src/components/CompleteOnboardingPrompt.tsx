import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface CompleteOnboardingPromptProps {
  onShowBaseline: () => void;
}

export const CompleteOnboardingPrompt: React.FC<CompleteOnboardingPromptProps> = ({ onShowBaseline }) => {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          Complete Your Profile to Start Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Before you can start your daily check-ins, we need a few more details to personalize your experience and provide meaningful insights.
        </p>
        <div className="bg-white p-4 rounded-lg space-y-2">
          <p className="font-medium text-gray-800">What we'll ask:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
            <li>Your preferred nickname</li>
            <li>Confidence levels with medications and costs</li>
            <li>Your overall confidence in the process</li>
          </ul>
        </div>
        <Button 
          onClick={onShowBaseline}
          className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
        >
          Complete My Profile
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};