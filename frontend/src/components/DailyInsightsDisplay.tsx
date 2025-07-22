// DailyInsightsDisplay.tsx - Fixed TypeScript errors
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Heart, TrendingUp, Brain, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Insight {
  type: string;
  title: string;
  message: string;
  confidence: number;
  priority?: number;
}

interface AnalysisData {
  checkins_analyzed: number;
  date_range: string;
  user_id: string;
}

interface InsightResponse {
  success: boolean;
  insight: Insight;
  analysis_data: AnalysisData;
}

const DailyInsightsDisplay: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch insights when component mounts
  useEffect(() => {
    if (isAuthenticated && isVisible) {
      fetchDailyInsights();
    }
  }, [isAuthenticated, isVisible]);

  // Track view engagement when insight is displayed
  useEffect(() => {
    if (insight && isVisible && !hasBeenViewed) {
      trackEngagement('viewed');
      setHasBeenViewed(true);
    }
  }, [insight, isVisible, hasBeenViewed]);

  const fetchDailyInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      console.log('🧠 Fetching insights with token:', !!token);
      
      const response = await fetch('https://novara-mvp-production.up.railway.app/api/insights/daily', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Insights response status:', response.status);
      const data: InsightResponse = await response.json();
      console.log('📊 Insights response data:', data);

      if (data.success) {
        setInsight(data.insight);
        setAnalysisData(data.analysis_data);
      } else {
        setError('Unable to generate insights right now');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Connection error - insights temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const trackEngagement = async (action: 'viewed' | 'clicked' | 'dismissed' | 'refreshed') => {
    if (!insight) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('https://novara-mvp-production.up.railway.app/api/insights/engagement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insight_type: insight.type,
          action,
          insight_id: `${insight.type}_${Date.now()}`
        })
      });
    } catch (err) {
      console.error('Error tracking engagement:', err);
      // Don't show error to user for tracking failures
    }
  };

  const handleDismiss = () => {
    trackEngagement('dismissed');
    setIsVisible(false);
  };

  const handleRefresh = () => {
    trackEngagement('refreshed');
    setHasBeenViewed(false); // Reset view tracking
    fetchDailyInsights();
  };

  const handleClick = () => {
    trackEngagement('clicked');
    // You could expand this to show more detailed insights or navigation
  };

  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      confidence_rising: TrendingUp,
      confidence_support: Heart,
      positive_streak: Heart,
      challenging_support: Heart,
      emotional_awareness: Brain,
      concern_pattern: Lightbulb,
      consistency_celebration: TrendingUp,
      steady_strength: Heart,
      welcome: Heart,
      general_support: Heart
    };

    const IconComponent = iconMap[type] || Lightbulb;
    return <IconComponent className="w-5 h-5" />;
  };

  // Get color scheme based on insight type
  const getColorScheme = (type: string) => {
    const colorMap: Record<string, { border: string; bg: string; icon: string; button: string }> = {
      confidence_rising: {
        border: 'border-green-200',
        bg: 'bg-gradient-to-br from-green-50 to-white',
        icon: 'text-green-600',
        button: 'bg-green-100 hover:bg-green-200 text-green-800'
      },
      confidence_support: {
        border: 'border-blue-200',
        bg: 'bg-gradient-to-br from-blue-50 to-white',
        icon: 'text-blue-600',
        button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
      },
      positive_streak: {
        border: 'border-yellow-200',
        bg: 'bg-gradient-to-br from-yellow-50 to-white',
        icon: 'text-yellow-600',
        button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
      },
      challenging_support: {
        border: 'border-[#CBA7FF]',
        bg: 'bg-gradient-to-br from-purple-50 to-white',
        icon: 'text-purple-600',
        button: 'bg-purple-100 hover:bg-purple-200 text-purple-800'
      },
      default: {
        border: 'border-[#FF6F61]',
        bg: 'bg-gradient-to-br from-[#FFF5F0] to-white',
        icon: 'text-[#FF6F61]',
        button: 'bg-[#FF6F61]/10 hover:bg-[#FF6F61]/20 text-[#FF6F61]'
      }
    };

    return colorMap[type] || colorMap.default;
  };

  // Don't render if not authenticated or dismissed
  if (!isAuthenticated || !isVisible) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mb-6 border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#FF6F61]" />
            <span className="text-sm text-gray-600">Analyzing your journey...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto mb-6 border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="text-[#FF6F61] border-[#FF6F61] hover:bg-[#FF6F61]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No insight available
  if (!insight) {
    return null;
  }

  const colors = getColorScheme(insight.type);

  return (
    <Card className={`w-full max-w-md mx-auto mb-6 border-2 ${colors.border} ${colors.bg} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className={colors.icon}>
              {getInsightIcon(insight.type)}
            </span>
            <span className="text-gray-800">Daily Insight</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Insight Content */}
          <div 
            className="cursor-pointer"
            onClick={handleClick}
          >
            <h3 className="font-semibold text-gray-800 mb-2">
              {insight.title}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {insight.message}
            </p>
          </div>

          {/* Analysis Summary */}
          {analysisData && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Based on {analysisData.checkins_analyzed} recent check-ins
                {analysisData.checkins_analyzed > 1 && (
                  <span className="ml-1">
                    ({analysisData.date_range})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            
            <div className="text-xs text-gray-400">
              {Math.round(insight.confidence * 100)}% confidence
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyInsightsDisplay;