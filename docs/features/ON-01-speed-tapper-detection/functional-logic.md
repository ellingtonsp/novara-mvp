# ON-01 Functional Logic: Speed-Tapper Detection

## Core Detection Algorithm

### Speed-Tap Detection Logic
```typescript
interface TapEvent {
  timestamp: number;
  eventType: 'focus' | 'click' | 'change' | 'blur';
  step: number;
  sessionId: string;
}

interface SpeedTapConfig {
  timeWindowMs: number;      // 10000ms (10 seconds)
  tapThreshold: number;      // 3 taps
  maxStep: number;          // 3 (before confidence sliders)
  rollingWindow: boolean;   // true
}

class SpeedTapDetector {
  private tapHistory: TapEvent[] = [];
  private config: SpeedTapConfig;
  
  constructor(config: Partial<SpeedTapConfig> = {}) {
    this.config = {
      timeWindowMs: 10000,
      tapThreshold: 3,
      maxStep: 3,
      rollingWindow: true,
      ...config
    };
  }
  
  recordTap(eventType: TapEvent['eventType'], step: number): boolean {
    const tapEvent: TapEvent = {
      timestamp: Date.now(),
      eventType,
      step,
      sessionId: this.getSessionId()
    };
    
    this.tapHistory.push(tapEvent);
    this.cleanupOldTaps();
    
    return this.checkSpeedTapDetection();
  }
  
  private cleanupOldTaps(): void {
    const cutoffTime = Date.now() - this.config.timeWindowMs;
    this.tapHistory = this.tapHistory.filter(tap => tap.timestamp > cutoffTime);
  }
  
  private checkSpeedTapDetection(): boolean {
    // Only detect before reaching max step
    if (this.getCurrentStep() >= this.config.maxStep) {
      return false;
    }
    
    // Check if we have enough taps in the time window
    return this.tapHistory.length >= this.config.tapThreshold;
  }
  
  private getCurrentStep(): number {
    return Math.max(...this.tapHistory.map(tap => tap.step), 1);
  }
  
  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 
           `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Onboarding Flow State Management

### Onboarding State Machine
```typescript
interface OnboardingState {
  currentStep: number;
  path: 'standard' | 'fast';
  triggerReason: 'default' | 'speed_tap' | 'manual';
  startTime: number;
  tapCount: number;
  formData: Partial<UserData>;
  isSpeedTapper: boolean;
}

class OnboardingFlowManager {
  private state: OnboardingState;
  private detector: SpeedTapDetector;
  
  constructor() {
    this.state = {
      currentStep: 1,
      path: 'standard',
      triggerReason: 'default',
      startTime: Date.now(),
      tapCount: 0,
      formData: {},
      isSpeedTapper: false
    };
    
    this.detector = new SpeedTapDetector();
  }
  
  handleUserInteraction(eventType: TapEvent['eventType']): void {
    this.state.tapCount++;
    
    // Record tap and check for speed-tap detection
    const isSpeedTap = this.detector.recordTap(eventType, this.state.currentStep);
    
    if (isSpeedTap && !this.state.isSpeedTapper) {
      this.triggerFastPath();
    }
  }
  
  private triggerFastPath(): void {
    this.state.path = 'fast';
    this.state.triggerReason = 'speed_tap';
    this.state.isSpeedTapper = true;
    
    // Track the path selection
    this.trackPathSelection();
    
    // Show transition message
    this.showTransitionMessage();
  }
  
  private trackPathSelection(): void {
    track('onboarding_path_selected', {
      path: this.state.path,
      trigger_reason: this.state.triggerReason,
      tap_count: this.state.tapCount,
      time_window_ms: 10000,
      detection_step: this.state.currentStep,
      environment: process.env.NODE_ENV
    });
  }
  
  private showTransitionMessage(): void {
    // Show toast notification
    showToast({
      message: "We've streamlined these last questions for you.",
      type: 'info',
      duration: 3000
    });
  }
  
  completeOnboarding(): void {
    const completionTime = Date.now() - this.state.startTime;
    
    track('onboarding_completed', {
      path: this.state.path,
      completion_ms: completionTime,
      steps_completed: this.state.currentStep,
      total_steps: this.state.path === 'fast' ? 3 : 5,
      fields_completed: Object.keys(this.state.formData),
      environment: process.env.NODE_ENV
    });
  }
}
```

## Fast Path Form Logic

### Fast Onboarding Form
```typescript
interface FastOnboardingData {
  email: string;
  cycle_stage: string;
  primary_concern: string;
}

class FastOnboardingForm {
  private formData: FastOnboardingData;
  private validationRules: ValidationRule[];
  
  constructor() {
    this.formData = {
      email: '',
      cycle_stage: '',
      primary_concern: ''
    };
    
    this.validationRules = [
      {
        field: 'email',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      {
        field: 'cycle_stage',
        required: true,
        options: ['ivf_prep', 'ivf_active', 'post_ivf', 'considering'],
        message: 'Please select your current stage'
      },
      {
        field: 'primary_concern',
        required: true,
        options: ['medical_clarity', 'financial_costs', 'emotional_support', 'logistics'],
        message: 'Please select your biggest concern'
      }
    ];
  }
  
  updateField(field: keyof FastOnboardingData, value: string): void {
    this.formData[field] = value;
  }
  
  validate(): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of this.validationRules) {
      const value = this.formData[rule.field];
      
      if (rule.required && !value) {
        errors.push(rule.message);
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message);
        continue;
      }
      
      if (rule.options && !rule.options.includes(value)) {
        errors.push(rule.message);
        continue;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  getFormData(): FastOnboardingData {
    return { ...this.formData };
  }
}
```

## Analytics Integration

### Enhanced Tracking Functions
```typescript
// Enhanced from AN-01 tracking
export const trackOnboardingEvent = (eventName: string, properties: any) => {
  const baseProperties = {
    environment: process.env.NODE_ENV,
    timestamp: Date.now(),
    session_id: getSessionId()
  };
  
  const enhancedProperties = {
    ...baseProperties,
    ...properties
  };
  
  // Use existing AN-01 tracking infrastructure
  track(eventName, enhancedProperties);
  
  // Also send to backend for additional processing
  sendToBackend(eventName, enhancedProperties);
};

export const trackPathSelection = (path: 'fast' | 'standard', context: PathSelectionContext) => {
  trackOnboardingEvent('onboarding_path_selected', {
    path,
    trigger_reason: context.triggerReason,
    tap_count: context.tapCount,
    time_window_ms: context.timeWindowMs,
    detection_step: context.detectionStep,
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`
  });
};

export const trackOnboardingCompletion = (completionData: CompletionData) => {
  trackOnboardingEvent('onboarding_completed', {
    path: completionData.path,
    completion_ms: completionData.completionMs,
    steps_completed: completionData.stepsCompleted,
    total_steps: completionData.totalSteps,
    fields_completed: completionData.fieldsCompleted,
    form_errors: completionData.formErrors,
    retry_count: completionData.retryCount
  });
};
```

## Performance Optimization

### Memory Management
```typescript
class TapHistoryManager {
  private maxHistorySize = 100;
  private cleanupInterval = 30000; // 30 seconds
  
  constructor() {
    this.startCleanupInterval();
  }
  
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldTaps();
    }, this.cleanupInterval);
  }
  
  private cleanupOldTaps(): void {
    const cutoffTime = Date.now() - 10000;
    const tapHistory = this.getTapHistory();
    const recentTaps = tapHistory.filter(tap => tap.timestamp > cutoffTime);
    
    // Limit history size
    if (recentTaps.length > this.maxHistorySize) {
      recentTaps.splice(0, recentTaps.length - this.maxHistorySize);
    }
    
    this.setTapHistory(recentTaps);
  }
  
  private getTapHistory(): TapEvent[] {
    try {
      return JSON.parse(sessionStorage.getItem('tapHistory') || '[]');
    } catch {
      return [];
    }
  }
  
  private setTapHistory(taps: TapEvent[]): void {
    try {
      sessionStorage.setItem('tapHistory', JSON.stringify(taps));
    } catch (error) {
      console.warn('Failed to save tap history:', error);
    }
  }
}
```

### Debounced Detection
```typescript
class DebouncedSpeedTapDetector extends SpeedTapDetector {
  private debounceTimeout: NodeJS.Timeout | null = null;
  private debounceDelay = 100; // 100ms debounce
  
  recordTap(eventType: TapEvent['eventType'], step: number): boolean {
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Set new timeout for detection
    return new Promise<boolean>((resolve) => {
      this.debounceTimeout = setTimeout(() => {
        const result = super.recordTap(eventType, step);
        resolve(result);
      }, this.debounceDelay);
    });
  }
}
```

## Error Handling & Fallbacks

### Graceful Degradation
```typescript
class RobustSpeedTapDetector {
  private detector: SpeedTapDetector;
  private fallbackEnabled = true;
  
  constructor() {
    this.detector = new SpeedTapDetector();
  }
  
  recordTap(eventType: TapEvent['eventType'], step: number): boolean {
    try {
      return this.detector.recordTap(eventType, step);
    } catch (error) {
      console.warn('Speed-tap detection failed:', error);
      
      if (this.fallbackEnabled) {
        return this.fallbackDetection(eventType, step);
      }
      
      return false;
    }
  }
  
  private fallbackDetection(eventType: TapEvent['eventType'], step: number): boolean {
    // Simple fallback: detect rapid clicks only
    if (eventType === 'click' && step < 3) {
      const recentClicks = this.getRecentClicks();
      return recentClicks.length >= 3;
    }
    
    return false;
  }
  
  private getRecentClicks(): TapEvent[] {
    try {
      const history = JSON.parse(sessionStorage.getItem('tapHistory') || '[]');
      const cutoffTime = Date.now() - 10000;
      return history.filter(tap => 
        tap.eventType === 'click' && tap.timestamp > cutoffTime
      );
    } catch {
      return [];
    }
  }
}
```

## Testing Utilities

### Mock Detection Testing
```typescript
class MockSpeedTapDetector extends SpeedTapDetector {
  private mockTaps: TapEvent[] = [];
  
  setMockTaps(taps: TapEvent[]): void {
    this.mockTaps = taps;
  }
  
  recordTap(eventType: TapEvent['eventType'], step: number): boolean {
    // Use mock data instead of real detection
    const cutoffTime = Date.now() - 10000;
    const recentTaps = this.mockTaps.filter(tap => tap.timestamp > cutoffTime);
    
    return recentTaps.length >= 3 && step < 3;
  }
}

// Test scenarios
const testScenarios = [
  {
    name: '3 taps in 9.9s should trigger fast path',
    taps: [
      { timestamp: 1000, eventType: 'click', step: 1 },
      { timestamp: 5000, eventType: 'click', step: 1 },
      { timestamp: 9900, eventType: 'click', step: 2 }
    ],
    expected: true
  },
  {
    name: '3 taps in 10.1s should not trigger fast path',
    taps: [
      { timestamp: 1000, eventType: 'click', step: 1 },
      { timestamp: 5000, eventType: 'click', step: 1 },
      { timestamp: 10100, eventType: 'click', step: 2 }
    ],
    expected: false
  }
];
``` 