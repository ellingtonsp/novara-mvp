// Check-in Preference Toggle - Allows users to choose daily quick vs comprehensive
// Enables A/B testing while maximizing user autonomy

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Button import removed - using standard HTML buttons instead
import { 
  Settings, Zap, Calendar, Check, Info,
  TrendingUp, Clock, Heart 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { track } from '../lib/analytics';

interface CheckinPreference {
  type: 'quick_daily' | 'comprehensive_daily';
  setAt: string;
  reason?: string;
}

interface CheckinPreferenceToggleProps {
  onPreferenceChange?: (preference: 'quick_daily' | 'comprehensive_daily') => void;
  currentPreference?: 'quick_daily' | 'comprehensive_daily';
}

export const CheckinPreferenceToggle: React.FC<CheckinPreferenceToggleProps> = ({ 
  onPreferenceChange,
  currentPreference 
}) => {
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [localPreference, setLocalPreference] = useState<'quick_daily' | 'comprehensive_daily'>(currentPreference || 'quick_daily');
  const [hasSeenOptions, setHasSeenOptions] = useState(false);

  useEffect(() => {
    // Load saved preference
    const savedPref = localStorage.getItem(`checkin_preference_${user?.email}`);
    if (savedPref) {
      const pref: CheckinPreference = JSON.parse(savedPref);
      setLocalPreference(pref.type);
      setHasSeenOptions(true);
    } else {
      // Default to quick for new users
      setCurrentPreference('quick_daily');
    }
  }, [user]);

  useEffect(() => {
    // Check if user should see preference option (after 3 check-ins)
    const checkinsCount = parseInt(localStorage.getItem(`checkin_count_${user?.email}`) || '0');
    if (checkinsCount >= 3 && !hasSeenOptions && !showOptions) {
      setShowOptions(true);
    }
  }, [user, hasSeenOptions, showOptions]);

  const handlePreferenceChange = (newPreference: 'quick_daily' | 'comprehensive_daily', reason?: string) => {
    const preference: CheckinPreference = {
      type: newPreference,
      setAt: new Date().toISOString(),
      reason
    };

    // Save preference
    localStorage.setItem(`checkin_preference_${user?.email}`, JSON.stringify(preference));
    setCurrentPreference(newPreference);
    setHasSeenOptions(true);
    setShowOptions(false);

    // Track for A/B testing
    track('checkin_preference_selected', {
      user_id: user?.id || '',
      preference: newPreference,
      reason,
      previous_preference: localPreference,
      checkins_before_switch: parseInt(localStorage.getItem(`checkin_count_${user?.email}`) || '0')
    });

    // Notify parent
    onPreferenceChange?.(newPreference);
  };

  if (!showOptions && hasSeenOptions) {
    // Show subtle preference indicator
    return (
      <button
        onClick={() => setShowOptions(true)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
      >
        <Settings className="h-4 w-4" />
        {localPreference === 'quick_daily' ? 'Quick daily check-ins' : 'Comprehensive daily check-ins'}
      </button>
    );
  }

  if (!showOptions) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Heart className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-800 mb-1">
              Customize Your Check-in Experience
            </h3>
            <p className="text-sm text-gray-600">
              Choose what works best for your routine - you can always change this later
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Quick Daily Option */}
          <button
            onClick={() => handlePreferenceChange('quick_daily', 'prefer_quick')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              localPreference === 'quick_daily' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800">Quick Daily Check-ins</h4>
                  {localPreference === 'quick_daily' && (
                    <Check className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  30 seconds daily • Just mood, meds & confidence
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    <Clock className="h-3 w-3" />
                    Fastest
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    <TrendingUp className="h-3 w-3" />
                    82% outcome prediction
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  + Weekly prompts for deeper insights when you have time
                </p>
              </div>
            </div>
          </button>

          {/* Comprehensive Daily Option */}
          <button
            onClick={() => handlePreferenceChange('comprehensive_daily', 'want_detailed')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              localPreference === 'comprehensive_daily' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800">Comprehensive Daily Check-ins</h4>
                  {localPreference === 'comprehensive_daily' && (
                    <Check className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  2-3 minutes daily • Full emotional & treatment tracking
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    <Info className="h-3 w-3" />
                    Most detailed
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    <TrendingUp className="h-3 w-3" />
                    95% outcome prediction
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Track anxiety, side effects, coping strategies & more
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Research context */}
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-700">
            <strong>Research note:</strong> Both options provide valuable insights. 
            Quick check-ins capture the most predictive metrics, while comprehensive 
            check-ins help us personalize support even better.
          </p>
        </div>

        {/* Skip for now option */}
        {!hasSeenOptions && (
          <button
            onClick={() => setShowOptions(false)}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Ask me later
          </button>
        )}
      </CardContent>
    </Card>
  );
};