import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DailyCheckinFormProps {
  onComplete?: () => void;
}

const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({ onComplete }) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [confidenceToday, setConfidenceToday] = useState(5);
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [immediateInsight, setImmediateInsight] = useState('');

  // Mobile-optimized mood options with better visual hierarchy
  const moodOptions = [
    { 
      mood: 'hopeful', 
      label: 'Hopeful', 
      icon: '🌟',
      description: 'Positive about the journey',
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

  // Toggle mood selection for multiple moods
  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const generateImmediateInsight = (moods: string[], confidence: number) => {
    if (moods.includes('hopeful') || moods.includes('excited')) {
      return "Your positive energy today is beautiful - hold onto that hope! 💛";
    }
    if (moods.includes('anxious') || moods.includes('worried')) {
      return "It's completely normal to feel this way during IVF. You're doing amazingly. 🤗";
    }
    if (moods.includes('overwhelmed')) {
      return "Take it one day at a time. You're stronger than you know. 🌸";
    }
    if (confidence <= 3) {
      return "Low confidence days are part of the journey. Be gentle with yourself today. 💙";
    }
    if (moods.includes('grateful')) {
      return "Gratitude is such a powerful force. Thank you for sharing that with us. ✨";
    }
    if (confidence >= 8) {
      return "Your confidence is shining through today - that's wonderful to see! ⭐";
    }
    return "Thank you for checking in today. Every step of this journey matters. 🌿";
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please log in to submit a check-in');
      return;
    }

    if (selectedMoods.length === 0) {
      alert('Please select at least one mood');
      return;
    }

    setIsSubmitting(true);

    const checkinData = {
      mood_today: selectedMoods.join(', '),
      confidence_today: confidenceToday,
      ...(primaryConcern && { primary_concern_today: primaryConcern }),
      ...(userNote && { user_note: userNote })
    };

    console.log('🎯 Submitting check-in data:', checkinData);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      const response = await fetch('https://novara-mvp-production.up.railway.app/api/checkins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkinData)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const insight = generateImmediateInsight(selectedMoods, confidenceToday);
        setImmediateInsight(insight);
        setShowSuccess(true);
        
        // Reset form
        setSelectedMoods([]);
        setPrimaryConcern('');
        setConfidenceToday(5);
        setUserNote('');

        // Call onComplete after a short delay to show success state
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 2000);
      } else {
        console.error('❌ Check-in failed:', responseData);
        alert(`Check-in failed: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile Success State
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2 border-[#FF6F61] bg-gradient-to-br from-[#FFF5F0] to-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#FF6F61] mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Check-in Complete!</h3>
            <div className="bg-white p-6 rounded-xl border border-[#CBA7FF]/30 mb-6">
              <p className="text-gray-700 leading-relaxed">
                {immediateInsight}
              </p>
            </div>
            <Button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white py-3 text-lg"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile Check-in Form
  return (
    <div className="min-h-screen bg-[#FFF5F0]">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm px-4 py-6 safe-area-pt">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-[#FF6F61]" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Daily Check-in</h1>
              {user?.nickname && (
                <p className="text-sm text-gray-600">Hi {user.nickname}! How are you today?</p>
              )}
            </div>
          </div>
          <div className="text-2xl">✨</div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 pb-32">
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
                className={`p-4 rounded-xl border-2 transition-all text-left active:scale-95 ${
                  selectedMoods.includes(mood)
                    ? 'border-[#FF6F61] bg-[#FF6F61]/10 ring-2 ring-[#FF6F61]/20 scale-95' 
                    : color
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
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
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-[#FF6F61] mb-2">{confidenceToday}/10</div>
            <div className="text-sm text-gray-600">
              {confidenceToday <= 3 && "Taking it one step at a time"}
              {confidenceToday > 3 && confidenceToday <= 6 && "Finding your rhythm"}
              {confidenceToday > 6 && confidenceToday <= 8 && "Feeling strong"}
              {confidenceToday > 8 && "Absolutely crushing it!"}
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={confidenceToday}
            onChange={(e) => setConfidenceToday(Number(e.target.value))}
            className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-coral"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-3">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>

        {/* Mobile Primary Concern */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Primary Concern Today
            <span className="block text-sm font-normal text-gray-600 mt-1">
              Optional - what's on your mind?
            </span>
          </h2>
          <select
            value={primaryConcern}
            onChange={(e) => setPrimaryConcern(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF6F61] focus:border-transparent text-base bg-white"
          >
            <option value="">Choose if you'd like to share</option>
            {concernOptions.map(concern => (
              <option key={concern} value={concern}>{concern}</option>
            ))}
          </select>
        </div>

        {/* Mobile Note Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Anything else?
            <span className="block text-sm font-normal text-gray-600 mt-1">
              Optional - share any thoughts about your day
            </span>
          </h2>
          <Textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF6F61] focus:border-transparent text-base resize-none bg-white"
            rows={4}
            placeholder="Share anything else about your day, feelings, or journey..."
          />
        </div>
      </div>

      {/* Mobile Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb z-40">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedMoods.length === 0 || isSubmitting}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
            selectedMoods.length === 0 || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#FF6F61] text-white hover:bg-[#e55a4d] shadow-sm'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Complete Check-in'
          )}
        </button>
        {selectedMoods.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Please select at least one mood to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyCheckinForm;