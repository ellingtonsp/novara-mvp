// DailyInsightsDisplay.tsx - Fixed TypeScript errors
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Heart, TrendingUp, Brain, X, RefreshCw, ThumbsUp, Bookmark } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const fetchDailyInsights = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
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
        setError('Complete a few check-ins to unlock daily insights');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Connection error - insights temporarily unavailable');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const trackEngagement = async (action: 'viewed' | 'clicked' | 'dismissed' | 'refreshed' | 'liked' | 'saved') => {
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
    }
  };

  const handleDismiss = () => {
    trackEngagement('dismissed');
    setIsVisible(false);
  };

  const handleRefresh = () => {
    trackEngagement('refreshed');
    setHasBeenViewed(false);
    fetchDailyInsights(true);
  };

  const handleClick = () => {
    trackEngagement('clicked');
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEngagement('liked');
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEngagement('saved');
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
    return <IconComponent className="w-6 h-6" />;
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
      emotional_awareness: {
        border: 'border-indigo-200',
        bg: 'bg-gradient-to-br from-indigo-50 to-white',
        icon: 'text-indigo-600',
        button: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
      },
      concern_pattern: {
        border: 'border-orange-200',
        bg: 'bg-gradient-to-br from-orange-50 to-white',
        icon: 'text-orange-600',
        button: 'bg-orange-100 hover:bg-orange-200 text-orange-800'
      },
      consistency_celebration: {
        border: 'border-pink-200',
        bg: 'bg-gradient-to-br from-pink-50 to-white',
        icon: 'text-pink-600',
        button: 'bg-pink-100 hover:bg-pink-200 text-pink-800'
      },
      steady_strength: {
        border: 'border-teal-200',
        bg: 'bg-gradient-to-br from-teal-50 to-white',
        icon: 'text-teal-600',
        button: 'bg-teal-100 hover:bg-teal-200 text-teal-800'
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

  // Mobile Loading state
  if (isLoading) {
    return (
      <Card className="w-full mx-auto mb-6 border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#FF6F61]" />
            <span className="text-gray-600">Analyzing your journey...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile Error state
  if (error) {
    return (
      <Card className="w-full mx-auto mb-6 border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchDailyInsights()}
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
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🌱</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep checking in!</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Complete a few more daily check-ins to start seeing personalized insights about your patterns.
        </p>
      </div>
    );
  }

  const colors = getColorScheme(insight.type);

  return (
    <Card className={`w-full mx-auto mb-6 border-2 ${colors.border} ${colors.bg} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${colors.icon} p-2 rounded-lg bg-white/60`}>
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg text-gray-800">Daily Insight</CardTitle>
              <div className="text-sm text-gray-500">
                {Math.round(insight.confidence * 100)}% confidence
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Mobile Insight Content */}
          <div 
            className="cursor-pointer"
            onClick={handleClick}
          >
            <h3 className="font-semibold text-gray-800 mb-3 text-lg leading-relaxed">
              {insight.title}
            </h3>
            <p className="text-gray-700 leading-relaxed text-base">
              {insight.message}
            </p>
          </div>

          {/* Mobile Analysis Summary */}
          {analysisData && (
            <div className="bg-white/60 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 text-sm mb-2">Based on your data:</h4>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-2">📊</span>
                  <span>{analysisData.checkins_analyzed} check-ins analyzed</span>
                </div>
                {analysisData.checkins_analyzed > 1 && (
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">📅</span>
                    <span>{analysisData.date_range}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleLike}
              className="flex-1 bg-white/80 hover:bg-white text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors active:scale-95 flex items-center justify-center space-x-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-white/80 hover:bg-white text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors active:scale-95 flex items-center justify-center space-x-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-3 bg-white/80 hover:bg-white text-gray-700 rounded-xl font-medium transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyInsightsDisplay;