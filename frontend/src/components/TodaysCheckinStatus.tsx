import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, Clock } from 'lucide-react';

interface TodaysCheckinStatusProps {
  lastCheckinTime: string;
  lastMood: string;
  lastConfidence: number;
  onReplaceCheckin: () => void;
  onViewInsights: () => void;
}

export const TodaysCheckinStatus: React.FC<TodaysCheckinStatusProps> = ({
  lastCheckinTime,
  lastMood,
  lastConfidence,
  onReplaceCheckin,
  onViewInsights
}) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: Record<string, string> = {
      hopeful: '🌟',
      anxious: '😰',
      neutral: '😐',
      grateful: '🙏',
      tired: '😴',
      worried: '😟',
      overwhelmed: '🌊',
      frustrated: '😤',
      excited: '🎉'
    };
    return moodMap[mood] || '💭';
  };

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-green-800 mb-4 text-lg">
            Today's Check-in Complete!
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>Checked in at {formatTime(lastCheckinTime)}</span>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Mood:</span>
                <span className="font-medium">{getMoodEmoji(lastMood)} {lastMood}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{lastConfidence}/10</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <Button
              onClick={onViewInsights}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
            >
              View Today's Insights
            </Button>
            
            <Button
              onClick={onReplaceCheckin}
              variant="outline"
              className="w-full border-green-600 text-green-700 hover:bg-green-50 font-medium py-2.5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Check-in
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
            <span>💡</span>
            <span>Changed your mind? You can update today's check-in with how you're feeling now</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};