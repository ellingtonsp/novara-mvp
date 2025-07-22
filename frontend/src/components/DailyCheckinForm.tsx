import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DailyCheckinForm: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
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

  // Toggle mood selection for multiple moods
  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const generateImmediateInsight = (moods: string[], confidence: number) => {
    // Updated logic for multiple moods
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

    // Validate required fields
    if (selectedMoods.length === 0) {
      alert('Please select at least one mood');
      return;
    }

    setIsSubmitting(true);

    // Format data exactly as the backend expects
    const checkinData = {
      mood_today: selectedMoods.join(', '), // Convert array to comma-separated string
      confidence_today: confidenceToday, // Make sure this is a number
      // Only include optional fields if they have values
      ...(primaryConcern && { primary_concern_today: primaryConcern }),
      ...(userNote && { user_note: userNote })
    };

    console.log('🎯 Submitting check-in data:', checkinData);
    console.log('🔑 Auth token exists:', !!localStorage.getItem('token'));

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      // Direct fetch call to debug the exact API interaction
      const response = await fetch('https://novara-mvp-production.up.railway.app/api/checkins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkinData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const responseData = await response.json();
      console.log('📊 Response data:', responseData);

      if (response.ok && responseData.success) {
        const insight = generateImmediateInsight(selectedMoods, confidenceToday);
        setImmediateInsight(insight);
        setShowSuccess(true);
        
        // Reset form
        setSelectedMoods([]);
        setPrimaryConcern('');
        setConfidenceToday(5);
        setUserNote('');
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

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <Heart className="w-12 h-12 text-[#FF6F61] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ready for your daily check-in?</h3>
          <p className="text-sm text-gray-600 mb-4">Please log in to track your IVF journey.</p>
          <Button className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success state
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

  // Main form
  return (
    <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
          <Heart className="w-5 h-5 text-[#FF6F61]" />
          Daily Check-In
          {user?.nickname && <span className="text-sm font-normal text-gray-500">Hi, {user.nickname}!</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mood Selection - Multiple Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How are you feeling today? (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {moodOptions.map(({ mood, label, icon, description, color }) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMoods.includes(mood)
                      ? 'border-[#FF6F61] bg-[#FF6F61]/10 ring-2 ring-[#FF6F61]/20' 
                      : color
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{icon}</span>
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
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedMoods.join(', ')}
              </p>
            )}
          </div>

          {/* Primary Concern - Updated Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you most concerned about today? (optional)
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
            <input
              type="range"
              min="1"
              max="10"
              value={confidenceToday}
              onChange={(e) => setConfidenceToday(Number(e.target.value))}
              className="w-full h-3 cursor-pointer rounded-lg"
              style={{
                background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${((confidenceToday - 1) / 9) * 100}%, #e5e7eb ${((confidenceToday - 1) / 9) * 100}%, #e5e7eb 100%)`,
                WebkitAppearance: 'none',
                appearance: 'none',
                outline: 'none'
              }}
            />
            <style dangerouslySetInnerHTML={{
              __html: `
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #FF6F61;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #FF6F61;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  border: none;
                }
              `
            }} />
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
            disabled={isSubmitting || selectedMoods.length === 0}
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