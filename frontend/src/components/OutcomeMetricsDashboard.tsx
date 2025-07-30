// Outcome Metrics Dashboard - Shows users real impact of their engagement
// Based on research: transparency about outcomes improves adherence by 34%

import React, { useState, useEffect, useRef } from 'react';
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
import { MetricTooltip } from './MetricTooltip';

interface UserMetrics {
  // Adherence metrics
  medicationAdherenceRate: number;
  medicationAdherenceTrend: 'improving' | 'stable' | 'declining';
  missedDosesLastWeek: number;
  totalMedicationCheckIns: number;
  
  // Mental health metrics
  currentPHQ4Score: number;
  phq4Trend: 'improving' | 'stable' | 'worsening';
  anxietyAverage: number;
  
  // Engagement metrics
  checkInStreak: number;
  totalCheckIns: number;
  insightEngagementRate: number; // Now represents daily check-in completion rate
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

interface OutcomeMetricsDashboardProps {
  onNavigate?: (view: string) => void;
}

export const OutcomeMetricsDashboard: React.FC<OutcomeMetricsDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'adherence' | 'mental-health' | 'predictions'>('overview');
  
  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const minSwipeDistance = 50;
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'adherence', label: 'Treatment', icon: Pill },
    { id: 'mental-health', label: 'Well-being', icon: Brain },
    { id: 'predictions', label: 'Outlook', icon: Target }
  ];
  
  const currentTabIndex = tabs.findIndex(tab => tab.id === selectedView);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX.current;
    
    // Swipe left (next tab)
    if (distance > minSwipeDistance && currentTabIndex < tabs.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedView(tabs[currentTabIndex + 1].id as any);
        setIsTransitioning(false);
      }, 150);
    }
    
    // Swipe right (previous tab)
    if (distance < -minSwipeDistance && currentTabIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedView(tabs[currentTabIndex - 1].id as any);
        setIsTransitioning(false);
      }, 150);
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
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
          totalMedicationCheckIns: 0,
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
        totalMedicationCheckIns: 0,
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
          ? 'Associated with lower cycle cancellation rates' 
          : 'Higher adherence may be associated with better outcomes',
        recommendation: metrics.medicationAdherenceRate < 85 
          ? 'Consider setting medication reminders' 
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
        metric: 'Daily Check-in Rate',
        yourValue: metrics.insightEngagementRate,
        benchmark: 70,
        impact: metrics.insightEngagementRate >= 70 
          ? 'Consistent tracking improves pattern identification' 
          : 'Daily tracking enhances personalized support',
        recommendation: metrics.insightEngagementRate < 70 
          ? 'Try setting a daily reminder' 
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
      <Card className="w-full mx-auto mb-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Metrics Dashboard</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Start tracking your IVF journey to unlock personalized metrics and insights about your treatment outcomes.
          </p>
          <div className="space-y-3 max-w-sm mx-auto text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-800">Track Medication Adherence</p>
                <p className="text-xs text-gray-600">Research suggests consistency correlates with treatment completion</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-800">Monitor Mental Health</p>
                <p className="text-xs text-gray-600">Understand the mind-body connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-800">Get Success Predictions</p>
                <p className="text-xs text-gray-600">Based on research and your patterns</p>
              </div>
            </div>
          </div>
          <Button 
            className="mt-4 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white text-sm py-2"
            onClick={() => onNavigate?.('checkin')}
          >
            Start Your First Check-In
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Debug logging
  console.log('🔍 OutcomeMetricsDashboard render:', {
    totalCheckIns: metrics?.totalCheckIns,
    totalMedicationCheckIns: metrics?.totalMedicationCheckIns,
    medicationAdherenceRate: metrics?.medicationAdherenceRate,
    missedDosesLastWeek: metrics?.missedDosesLastWeek,
    thresholdMet: (metrics?.totalMedicationCheckIns || 0) >= 3
  });

  return (
    <div className="space-y-4">
      {/* Navigation Tabs - Desktop only */}
      <div className="hidden sm:flex space-x-2 justify-around pb-2">
        {tabs.map((tab) => (
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
      
      {/* Mobile Header with Current Section */}
      <div className="sm:hidden space-y-2">
        <h3 className="text-lg font-semibold text-center">
          {tabs[currentTabIndex].label}
        </h3>
        
        {/* Icon Indicators */}
        <div className="flex justify-center items-center gap-3 pb-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <div 
                key={index}
                className={`transition-all duration-300 flex items-center justify-center ${
                  index === currentTabIndex 
                    ? 'w-10 h-10 bg-primary rounded-full text-white' 
                    : 'w-2 h-2 bg-gray-300 rounded-full'
                }`}
              >
                {index === currentTabIndex && <Icon className="h-5 w-5" />}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Swipeable Content Container */}
      <div 
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: '400px' }}
      >
        <div
          className={`transition-opacity ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transitionDuration: '150ms'
          }}
        >
      
      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="space-y-3">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <MetricTooltip metric="impact">
                  <span className="flex items-center gap-2 text-purple-800">
                    <Trophy className="h-5 w-5" />
                    Your Engagement Level
                  </span>
                </MetricTooltip>
                <span className="text-xl font-bold text-purple-600">
                  {metrics.cycleCompletionProbability > 75 ? 'Strong' : 
                   metrics.cycleCompletionProbability > 50 ? 'Building' : 'Developing'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-3">
                Your current engagement patterns {
                  metrics.cycleCompletionProbability > 75 ? 'align well with patients who successfully navigate their treatment journey' : 
                  metrics.cycleCompletionProbability > 50 ? 'show positive momentum and may benefit from targeted support' :
                  'suggest opportunities to explore additional resources and support options'
                }.
              </p>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <MetricTooltip metric="medication">
                      <span>Medication Adherence</span>
                    </MetricTooltip>
                    <span className={metrics.totalMedicationCheckIns >= 3 && metrics.medicationAdherenceRate > 0 ? getAdherenceColor(metrics.medicationAdherenceRate) : 'text-gray-400'}>
                      {metrics.totalMedicationCheckIns >= 3 && metrics.medicationAdherenceRate > 0 ? `${metrics.medicationAdherenceRate}%` : '—'}
                    </span>
                  </div>
                  <Progress value={metrics.totalMedicationCheckIns >= 3 && metrics.medicationAdherenceRate > 0 ? metrics.medicationAdherenceRate : 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <MetricTooltip metric="mood">
                      <span>Mental Health Score</span>
                    </MetricTooltip>
                    <span className={getPHQ4Color(metrics.currentPHQ4Score)}>
                      {12 - metrics.currentPHQ4Score}/12
                    </span>
                  </div>
                  <Progress value={(12 - metrics.currentPHQ4Score) / 12 * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <MetricTooltip metric="engagement">
                      <span>Engagement Score</span>
                    </MetricTooltip>
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
                  {(() => {
                    // Always show encouraging strengths, even when data-driven ones aren't available
                    const strengths = metrics?.protectiveFactors?.length > 0 
                      ? metrics.protectiveFactors
                      : [
                          'Taking proactive steps in your fertility journey',
                          'Using this app shows commitment to your health',
                          'Building health awareness through tracking'
                        ];
                    
                    return strengths.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ));
                  })()}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-800">Areas to Watch</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(metrics?.riskFactors || ['Loading risk factors...']).map((factor, idx) => (
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
                  {metrics.totalMedicationCheckIns >= 3 ? (
                    <span className={`text-2xl font-bold ${metrics.medicationAdherenceRate === 0 ? 'text-gray-400' : getAdherenceColor(metrics.medicationAdherenceRate)}`}>
                      {metrics.medicationAdherenceRate === 0 ? '—' : `${metrics.medicationAdherenceRate}%`}
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">—</span>
                  )}
                </div>
                {metrics.totalMedicationCheckIns >= 3 ? (
                  metrics.medicationAdherenceRate > 0 ? (
                    <>
                      <Progress value={metrics.medicationAdherenceRate} className="h-3 mb-2" />
                      <p className="text-sm text-gray-600">
                        You missed {metrics.missedDosesLastWeek} dose{metrics.missedDosesLastWeek !== 1 ? 's' : ''} last week. 
                        {metrics.missedDosesLastWeek === 0 && ' Perfect adherence! 🎉'}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">
                        Start tracking your medication status in daily check-ins to see adherence insights
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < metrics.totalMedicationCheckIns ? 'bg-purple-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Track medication in {3 - metrics.totalMedicationCheckIns} more check-in{3 - metrics.totalMedicationCheckIns !== 1 ? 's' : ''} to see your adherence insights
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < metrics.totalMedicationCheckIns ? 'bg-purple-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Research Insight
                </h4>
                <p className="text-sm text-blue-700">
                  Research suggests that patients with higher medication adherence tend to have 
                  better treatment completion rates. Studies indicate that consistent medication 
                  use correlates with reduced cycle cancellations and improved outcomes.
                </p>
                {metrics.totalMedicationCheckIns >= 3 && metrics.medicationAdherenceRate > 0 && metrics.medicationAdherenceRate < 90 && (
                  <p className="text-sm text-blue-800 font-medium mt-2">
                    Improving medication consistency may be associated with better treatment outcomes.
                  </p>
                )}
                {metrics.totalMedicationCheckIns >= 3 && metrics.medicationAdherenceRate === 0 && (
                  <p className="text-sm text-blue-800 font-medium mt-2">
                    Once you start tracking medication in your check-ins, we'll show how your adherence compares to research benchmarks.
                  </p>
                )}
                {metrics.totalMedicationCheckIns < 3 && (
                  <p className="text-sm text-blue-800 font-medium mt-2">
                    Once you have a week of data, we'll show how your adherence compares to research benchmarks.
                  </p>
                )}
              </div>
              
              {metrics.medicationAdherenceTrend !== 'stable' && metrics.totalMedicationCheckIns >= 14 && (
                <div className={`rounded-lg p-4 ${
                  metrics.medicationAdherenceTrend === 'improving' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    metrics.medicationAdherenceTrend === 'improving' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Your adherence is {metrics.medicationAdherenceTrend} compared to the previous week
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
                  Research indicates that lower anxiety and stress levels tend to correlate with 
                  higher treatment completion rates. Psychological support and stress management 
                  techniques may help patients stay engaged with their treatment plan.
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
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  <div className="text-lg text-gray-600 font-normal">Engagement Level</div>
                  {metrics.cycleCompletionProbability > 75 ? '🌟 Strong' : 
                   metrics.cycleCompletionProbability > 50 ? '📈 Building Momentum' : 
                   '🌱 Early Journey'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Based on correlations with adherence, well-being, and engagement patterns
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
                  <strong>Remember:</strong> These predictions focus on treatment cycle completion, not pregnancy outcomes. 
                  Your individual journey is unique, but these metrics help identify what 
                  support might be most helpful for completing your treatment plan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};