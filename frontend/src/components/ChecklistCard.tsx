// ChecklistCard.tsx - AP-01 Feature
// Displays personalized appointment prep checklist based on cycle stage

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CheckSquare, Square, Calendar, Heart, Sparkles, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getChecklistForStage } from '../lib/checklistMapping';
import { generateEnhancedChecklist, getUserContext, getSmartSuggestions, EnhancedChecklistItem } from '../lib/enhancedChecklistLogic';
import { track } from '../lib/analytics';

interface ChecklistCardProps {
  onComplete?: () => void;
  className?: string;
}

interface ChecklistProgress {
  completedIds: string[];
  cycleStage: string;
  lastUpdated: string;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({ onComplete, className = '' }) => {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<EnhancedChecklistItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [showPersonalizedInfo, setShowPersonalizedInfo] = useState(false);

  // Initialize enhanced checklist based on user's context
  useEffect(() => {
    const initializeChecklist = async () => {
      if (user?.cycle_stage) {
        setIsLoading(true);
        
        // Get base items for cycle stage
        const baseItems = getChecklistForStage(user.cycle_stage);
        
        // Get user context (moods, concerns, patterns)
        const context = await getUserContext(user);
        
        // Generate enhanced checklist
        const enhancedItems = generateEnhancedChecklist(baseItems, context);
        setChecklist(enhancedItems);
        
        // Get smart suggestions
        const suggestions = getSmartSuggestions(context);
        setSmartSuggestions(suggestions);
        
        // Load saved progress from localStorage
        const savedProgress = localStorage.getItem(`checklist_${user.email}`);
        if (savedProgress) {
          try {
            const progress: ChecklistProgress = JSON.parse(savedProgress);
            if (progress.cycleStage === user.cycle_stage) {
              setCompletedIds(progress.completedIds);
            }
          } catch (error) {
            console.warn('Failed to load checklist progress:', error);
          }
        }

        // Track enhanced checklist shown event
        track('checklist_shown', {
          cycle_stage: user.cycle_stage,
          item_ids: enhancedItems.map(item => item.id),
          has_contextual_items: enhancedItems.some(item => item.isContextual),
          personalized_count: enhancedItems.filter(item => item.isContextual).length,
          environment: import.meta.env.MODE
        });
        
        setIsLoading(false);
      }
    };
    
    initializeChecklist();
  }, [user]);

  // Handle item completion toggle
  const handleItemToggle = async (itemId: string) => {
    const isCompleting = !completedIds.includes(itemId);
    const newCompletedIds = isCompleting 
      ? [...completedIds, itemId]
      : completedIds.filter(id => id !== itemId);

    // Optimistic UI update
    setCompletedIds(newCompletedIds);

    // Save to localStorage immediately
    const progress: ChecklistProgress = {
      completedIds: newCompletedIds,
      cycleStage: user?.cycle_stage || 'baseline',
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`checklist_${user?.email}`, JSON.stringify(progress));

    // Track completion event
    track('checklist_item_completed', {
      item_id: itemId,
      cycle_stage: user?.cycle_stage || 'baseline',
      new_state: isCompleting ? 'completed' : 'uncompleted',
      environment: import.meta.env.MODE
    });

    // Check if all items are now complete
    if (newCompletedIds.length === checklist.length && checklist.length > 0) {
      setShowCelebration(true);
      
      // Track completion event
      track('checklist_completed', {
        cycle_stage: user?.cycle_stage || 'baseline',
        completion_time_ms: Date.now(),
        environment: import.meta.env.MODE
      });

      // Auto-hide celebration after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
        onComplete?.();
      }, 3000);
    }

    // TODO: Sync to backend API
    // await syncToBackend(newCompletedIds);
  };

  // Calculate progress percentage
  const progressPercentage = checklist.length > 0 ? (completedIds.length / checklist.length) * 100 : 0;

  // Don't render if no checklist items or user info
  if (!user?.cycle_stage || checklist.length === 0) {
    return null;
  }

  // Show celebration view when all items completed
  if (showCelebration) {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800">Great prep work! 🎉</h3>
            <p className="text-green-600 mt-2">
              You're all set for your appointment. Tomorrow you'll get an updated list based on your progress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className={`border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-purple-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-purple-200 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Calendar className="h-5 w-5" />
            Your Smart Prep Checklist
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPersonalizedInfo(!showPersonalizedInfo)}
            className="text-purple-600 hover:text-purple-800"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-purple-600">
          Personalized for your {user.cycle_stage.replace('_', ' ')} stage
          {checklist.filter(item => item.isContextual).length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-purple-700 font-medium">
              <Sparkles className="h-3 w-3" />
              {checklist.filter(item => item.isContextual).length} items added based on your recent check-ins
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-purple-600 mb-1">
            <span>{completedIds.length} of {checklist.length} complete</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Personalized info panel */}
        {showPersonalizedInfo && smartSuggestions.length > 0 && (
          <div className="mb-4 p-3 bg-purple-100 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Smart Insights
            </h4>
            <ul className="space-y-1">
              {smartSuggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-purple-700">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="space-y-3">
          {checklist.map((item) => {
            const isCompleted = completedIds.includes(item.id);
            
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm relative ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : item.priority === 'high' 
                      ? 'bg-white border-red-200 hover:border-red-300'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleItemToggle(item.id)}
              >
                {/* Priority indicator */}
                {item.priority === 'high' && !isCompleted && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
                
                <div className="flex items-start gap-3">
                  <button className="mt-0.5 focus:outline-none">
                    {isCompleted ? (
                      <CheckSquare className="h-5 w-5 text-green-500" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 hover:text-purple-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                        {item.title}
                      </h4>
                      {item.isContextual && !isCompleted && (
                        <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                    
                    {/* Personalized reason */}
                    {item.personalizedReason && !isCompleted && (
                      <p className="text-xs mt-2 text-purple-600 italic">
                        💡 {item.personalizedReason}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        item.category === 'medical' ? 'bg-blue-100 text-blue-700' :
                        item.category === 'comfort' ? 'bg-pink-100 text-pink-700' :
                        item.category === 'logistics' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {item.category}
                      </span>
                      
                      {/* Priority badge */}
                      {item.priority === 'high' && !isCompleted && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedIds.length > 0 && completedIds.length < checklist.length && (
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">
                You're doing great! {checklist.length - completedIds.length} more to go.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChecklistCard;