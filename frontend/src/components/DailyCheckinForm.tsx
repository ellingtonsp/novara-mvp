import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, CheckCircle } from 'lucide-react';

interface DailyCheckinData {
  mood_tags: string[];
  concerns: string;
  energy_level: number;
  user_email: string; // Will be passed from parent or auth context
}

const DailyCheckinForm: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [confidenceToday, setConfidenceToday] = useState(5);
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [immediateInsight, setImmediateInsight] = useState('');

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

  const concernOptions = [
    'Medication side effects',
    'Appointment outcomes',
    'Financial stress',
    'Relationship impact',
    'Physical discomfort',
    'Time management',
    'Work balance',
    'Family pressure',
    'Treatment effectiveness',
    'Other'
  ];

  const generateImmediateInsight = (mood: string, confidence: number) => {
    // Simple immediate feedback logic based on schema
    if (mood === 'hopeful' || mood === 'excited') {
      return "Your positive energy today is beautiful - hold onto that hope! 💛";
    }
    if (mood === 'anxious' || mood === 'worried') {
      return "It's completely normal to feel this way during IVF. You're doing amazingly. 🤗";
    }
    if (mood === 'overwhelmed') {
      return "Take it one day at a time. You're stronger than you know. 🌸";
    }
    if (confidence <= 3) {
      return "Low confidence days are part of the journey. Be gentle with yourself today. 💙";
    }
    if (mood === 'grateful') {
      return "Gratitude is such a powerful force. Thank you for sharing that with us. ✨";
    }
    if (confidence >= 8) {
      return "Your confidence is shining through today - that's wonderful to see! ⭐";
    }
    return "Thank you for checking in today. Every step of this journey matters. 🌿";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const checkinData: DailyCheckinData = {
      mood_tags: selectedMood ? [selectedMood] : [],
      concerns: primaryConcern.trim(),
      energy_level: confidenceToday,
      user_email: 'current-user@example.com' // TODO: Get from auth context
    };

    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('https://novara-mvp-production.up.railway.app/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkinData)
      });

      if (response.ok) {
        const insight = generateImmediateInsight(selectedMood, confidenceToday);
        setImmediateInsight(insight);
        setShowSuccess(true);
        
        // Reset form
        setSelectedMood('');
        setPrimaryConcern('');
        setConfidenceToday(5);
        setUserNote('');
      } else {
        console.error('Failed to submit check-in');
        // TODO: Add error handling UI
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
      // TODO: Add error handling UI
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto border-2 border-[#FF6F61] bg-gradient-to-br from-[#FFF5F0] to-white">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-[#FF6F61] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Check-in Complete!</h3>
          <div className="bg-white p-4 rounded-lg border border-[#CBA7FF]/30 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {immediateInsight}
            </p>
          </div>
          <Button 
            onClick={() => setShowSuccess(false)}
            className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
          <Heart className="w-5 h-5 text-[#FF6F61]" />
          Daily Check-In
        </CardTitle>
        <p className="text-sm text-gray-600">How are you feeling today?</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mood Selection - Clean Card Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How are you feeling today?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {moodOptions.map(({ mood, label, icon, description, color }) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMood === mood 
                      ? 'border-[#FF6F61] bg-[#FF6F61]/10 ring-2 ring-[#FF6F61]/20' 
                      : color
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <p className="text-xs opacity-75 leading-tight">
                    {description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Concern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary concern today (optional):
            </label>
            <select
              value={primaryConcern}
              onChange={(e) => setPrimaryConcern(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#FF6F61] focus:ring-2 focus:ring-[#FF6F61]/20 bg-white"
            >
              <option value="">Choose if you'd like to share</option>
              {concernOptions.map(concern => (
                <option key={concern} value={concern}>{concern}</option>
              ))}
            </select>
          </div>

          {/* Confidence Today */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence in your journey today (1-10):
            </label>
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-[#FF6F61] transition-all duration-200 ease-out"
                  style={{ width: `${confidenceToday * 10}%` }}
                />
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={confidenceToday}
                onChange={(e) => setConfidenceToday(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not confident</span>
              <span className="font-medium text-[#FF6F61]">{confidenceToday}/10</span>
              <span>Very confident</span>
            </div>
          </div>

          {/* User Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anything else you'd like to share? (optional)
            </label>
            <Textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Share any thoughts, questions, or reflections about today..."
              className="resize-none border-gray-200 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMood}
            className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Check-in'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCheckinForm;