// Outcome Metrics Dashboard - Shows users real impact of their engagement
// Based on research: transparency about outcomes improves adherence by 34%

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target, Activity, Brain, 
  AlertCircle, Trophy, Info, ChevronRight,
  Pill, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/environment';
import { Progress } from '@/components/ui/progress';

interface UserMetrics {
  // Adherence metrics
  medicationAdherenceRate: number;
  medicationAdherenceTrend: 'improving' | 'stable' | 'declining';
  missedDosesLastWeek: number;
  
  // Mental health metrics
  currentPHQ4Score: number;
  phq4Trend: 'improving' | 'stable' | 'worsening';
  anxietyAverage: number;
  
  // Engagement metrics
  checkInStreak: number;
  totalCheckIns: number;
  insightEngagementRate: number;
  checklistCompletionRate: number;
  
  // Support utilization
  copingStrategiesUsed: string[];
  mostEffectiveStrategy: string;
  partnerInvolvementRate: number;
  
  // Predictive metrics
  cycleCompletionProbability: number;
  riskFactors: string[];
  protectiveFactors: string[];
}

interface ResearchInsight {
  metric: string;
  yourValue: number;
  benchmark: number;
  impact: string;
  recommendation?: string;
}

export const OutcomeMetricsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'adherence' | 'mental-health' | 'predictions'>('overview');
  
  useEffect(() => {
    fetchUserMetrics();
  }, [user]);
  
  const fetchUserMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMetrics(data.metrics);
        console.log('✅ User metrics loaded successfully');
      } else {
        console.error('Failed to fetch metrics:', data.error);
        // Fallback to empty metrics if user has no data
        const emptyMetrics: UserMetrics = {
          medicationAdherenceRate: 0,
          medicationAdherenceTrend: 'stable',
          missedDosesLastWeek: 0,
          currentPHQ4Score: 0,
          phq4Trend: 'stable',
          anxietyAverage: 0,
          checkInStreak: 0,
          totalCheckIns: 0,
          insightEngagementRate: 0,
          checklistCompletionRate: 0,
          copingStrategiesUsed: [],
          mostEffectiveStrategy: 'None tracked yet',
          partnerInvolvementRate: 0,
          cycleCompletionProbability: 50,
          riskFactors: ['No data available yet'],
          protectiveFactors: ['Start tracking to see your strengths']
        };
        setMetrics(emptyMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Network error - show fallback
      const fallbackMetrics: UserMetrics = {
        medicationAdherenceRate: 0,
        medicationAdherenceTrend: 'stable',
        missedDosesLastWeek: 0,
        currentPHQ4Score: 0,
        phq4Trend: 'stable',
        anxietyAverage: 0,
        checkInStreak: 0,
        totalCheckIns: 0,
        insightEngagementRate: 0,
        checklistCompletionRate: 0,
        copingStrategiesUsed: [],
        mostEffectiveStrategy: 'None tracked yet',
        partnerInvolvementRate: 0,
        cycleCompletionProbability: 50,
        riskFactors: ['Unable to load data'],
        protectiveFactors: ['Check your connection']
      };
      setMetrics(fallbackMetrics);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getResearchInsights = (): ResearchInsight[] => {
    if (!metrics) return [];
    
    return [
      {
        metric: 'Medication Adherence',
        yourValue: metrics.medicationAdherenceRate,
        benchmark: 78,
        impact: metrics.medicationAdherenceRate > 85 
          ? '23% higher pregnancy rates vs. <85% adherence' 
          : 'Improving to >85% could increase success by 23%',
        recommendation: metrics.medicationAdherenceRate < 85 
          ? 'Set specific medication alarms and track in app' 
          : undefined
      },
      {
        metric: 'Mental Health (PHQ-4)',
        yourValue: metrics.currentPHQ4Score,
        benchmark: 6,
        impact: metrics.currentPHQ4Score < 6 
          ? '18% lower dropout risk with good mental health' 
          : 'Support interventions can reduce dropout by 31%',
        recommendation: metrics.currentPHQ4Score >= 6 
          ? 'Consider our guided coping exercises' 
          : undefined
      },
      {
        metric: 'Check-in Consistency',
        yourValue: metrics.checkInStreak,
        benchmark: 5,
        impact: metrics.checkInStreak >= 7 
          ? '35% better at identifying helpful patterns' 
          : 'Consistent tracking improves personalization',
        recommendation: metrics.checkInStreak < 7 
          ? 'Try setting a daily reminder' 
          : undefined
      },
      {
        metric: 'Partner Involvement',
        yourValue: metrics.partnerInvolvementRate,
        benchmark: 50,
        impact: metrics.partnerInvolvementRate > 60 
          ? '27% better treatment satisfaction with partner support' 
          : 'Partner involvement linked to better outcomes',
        recommendation: metrics.partnerInvolvementRate < 60 
          ? 'Share your dashboard with your partner' 
          : undefined
      }
    ];
  };
  
  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getPHQ4Color = (score: number) => {
    if (score < 3) return 'text-green-600';
    if (score < 6) return 'text-yellow-600';
    if (score < 9) return 'text-orange-600';
    return 'text-red-600';
  };
  
  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-200 rounded w-3/4"></div>
            <div className="h-4 bg-purple-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!metrics) return null;
  
  // Check if user has no data
  if (metrics.totalCheckIns === 0) {
    return (
      <Card className="w-full mx-auto mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Metrics Dashboard</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start tracking your IVF journey to unlock personalized metrics and insights about your treatment outcomes.
          </p>
          <div className="space-y-4 max-w-sm mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Track Medication Adherence</p>
                <p className="text-sm text-gray-600">See how consistency impacts success rates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Monitor Mental Health</p>
                <p className="text-sm text-gray-600">Understand the mind-body connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Get Success Predictions</p>
                <p className="text-sm text-gray-600">Based on research and your patterns</p>
              </div>
            </div>
          </div>
          <Button 
            className="mt-6 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
            onClick={() => setSelectedView('overview')}
          >
            Start Your First Check-In
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'adherence', label: 'Treatment', icon: Pill },
          { id: 'mental-health', label: 'Well-being', icon: Brain },
          { id: 'predictions', label: 'Outlook', icon: Target }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedView === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>
      
      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-purple-800">
                  <Trophy className="h-5 w-5" />
                  Your Impact Score
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {metrics.cycleCompletionProbability}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Based on your engagement patterns, you have an {metrics.cycleCompletionProbability}% 
                probability of completing your current cycle - that's {
                  metrics.cycleCompletionProbability > 75 ? 'excellent!' : 'good, with room to improve.'
                }
              </p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Medication Adherence</span>
                    <span className={getAdherenceColor(metrics.medicationAdherenceRate)}>
                      {metrics.medicationAdherenceRate}%
                    </span>
                  </div>
                  <Progress value={metrics.medicationAdherenceRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mental Health Score</span>
                    <span className={getPHQ4Color(metrics.currentPHQ4Score)}>
                      {12 - metrics.currentPHQ4Score}/12
                    </span>
                  </div>
                  <Progress value={(12 - metrics.currentPHQ4Score) / 12 * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement Rate</span>
                    <span className="text-purple-600">{metrics.insightEngagementRate}%</span>
                  </div>
                  <Progress value={metrics.insightEngagementRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Key Strengths & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800">Your Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {metrics.protectiveFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-800">Areas to Watch</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {metrics.riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Adherence View */}
      {selectedView === 'adherence' && (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-purple-800">Treatment Adherence Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">Current Adherence Rate</h4>
                  <span className={`text-2xl font-bold ${getAdherenceColor(metrics.medicationAdherenceRate)}`}>
                    {metrics.medicationAdherenceRate}%
                  </span>
                </div>
                <Progress value={metrics.medicationAdherenceRate} className="h-3 mb-2" />
                <p className="text-sm text-gray-600">
                  You missed {metrics.missedDosesLastWeek} dose{metrics.missedDosesLastWeek !== 1 ? 's' : ''} last week. 
                  {metrics.missedDosesLastWeek === 0 && ' Perfect adherence! 🎉'}
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Research Insight
                </h4>
                <p className="text-sm text-blue-700">
                  Patients with ≥90% medication adherence have 23% higher pregnancy rates and 
                  41% lower cycle cancellation rates compared to those with &lt;80% adherence 
                  (Nachtigall et al., 2012).
                </p>
                {metrics.medicationAdherenceRate < 90 && (
                  <p className="text-sm text-blue-800 font-medium mt-2">
                    Improving your adherence by {90 - metrics.medicationAdherenceRate}% could 
                    significantly improve your outcomes.
                  </p>
                )}
              </div>
              
              {metrics.medicationAdherenceTrend !== 'stable' && (
                <div className={`rounded-lg p-4 ${
                  metrics.medicationAdherenceTrend === 'improving' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    metrics.medicationAdherenceTrend === 'improving' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Your adherence is {metrics.medicationAdherenceTrend} compared to last month
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Mental Health View */}
      {selectedView === 'mental-health' && (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-purple-800">Mental Health & Well-being</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">PHQ-4 Score</h4>
                  <span className={`text-2xl font-bold ${getPHQ4Color(metrics.currentPHQ4Score)}`}>
                    {metrics.currentPHQ4Score}/12
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.currentPHQ4Score < 3 && 'Minimal symptoms - you\'re doing great!'}
                  {metrics.currentPHQ4Score >= 3 && metrics.currentPHQ4Score < 6 && 'Mild symptoms - proactive support can help'}
                  {metrics.currentPHQ4Score >= 6 && metrics.currentPHQ4Score < 9 && 'Moderate symptoms - additional support recommended'}
                  {metrics.currentPHQ4Score >= 9 && 'Higher symptoms - please reach out for support'}
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Your Coping Strategies</h4>
                <div className="space-y-2">
                  {metrics.copingStrategiesUsed.map((strategy, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{strategy}</span>
                      {strategy === metrics.mostEffectiveStrategy && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Most effective
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Impact on Treatment
                </h4>
                <p className="text-sm text-blue-700">
                  Patients with PHQ-4 scores &lt;6 have 82% cycle completion rates vs. 54% for 
                  scores ≥9. Mind-body interventions can reduce anxiety by up to 60% 
                  (Boivin & Lancastle, 2010).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Predictions View */}
      {selectedView === 'predictions' && (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-purple-800">Your Treatment Outlook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center">
                <h3 className="text-4xl font-bold text-gray-800 mb-2">
                  {metrics.cycleCompletionProbability}%
                </h3>
                <p className="text-lg text-gray-700">Cycle Completion Probability</p>
                <p className="text-sm text-gray-600 mt-2">
                  Based on your adherence, mental health, and engagement patterns
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">How Your Actions Impact Outcomes:</h4>
                {getResearchInsights().map((insight, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{insight.metric}</span>
                      <span className={`font-bold ${
                        insight.yourValue >= insight.benchmark ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {insight.yourValue}
                        {insight.metric.includes('%') ? '%' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{insight.impact}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-purple-600 font-medium flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {insight.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>Remember:</strong> These predictions are based on population data. 
                  Your individual journey is unique, but these metrics help identify what 
                  support might be most helpful for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};