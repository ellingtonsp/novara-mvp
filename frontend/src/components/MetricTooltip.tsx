import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface MetricTooltipProps {
  metric: 'mood' | 'medication' | 'confidence' | 'anxiety' | 'impact' | 'engagement';
  children?: React.ReactNode;
}

const tooltipContent = {
  mood: {
    title: 'Daily Mood',
    description: 'Your emotional state is the strongest predictor of treatment success. Tracking patterns helps us provide personalized support when you need it most.'
  },
  medication: {
    title: 'Medication Adherence',
    description: 'Taking medications as prescribed is crucial for treatment effectiveness. Missing doses can significantly impact your cycle outcomes.'
  },
  confidence: {
    title: 'Treatment Confidence',
    description: 'Your belief in treatment success affects outcomes. We use this to identify when you might need extra encouragement or support.'
  },
  anxiety: {
    title: 'Anxiety Level',
    description: 'Treatment anxiety is normal. Tracking helps us provide coping strategies and support at the right moments.'
  },
  impact: {
    title: 'Engagement Level',
    description: 'Reflects how your current patterns align with successful treatment journeys. This helps us identify support and resources that may be most helpful for you.'
  },
  engagement: {
    title: 'Engagement Score',
    description: 'Percentage of daily check-ins completed in the last 7 days. Consistent tracking helps us provide better personalized support and identify patterns in your journey.'
  }
};

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ metric, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setPosition] = useState<{ vertical: 'top' | 'bottom', horizontal: 'left' | 'center' | 'right' }>({
    vertical: 'top',
    horizontal: 'center'
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current && 
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      // Clean up any pending timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 256; // w-64 = 256px
      const tooltipHeight = 120; // approximate height
      
      // Determine vertical position
      const vertical = triggerRect.top - tooltipHeight < 10 ? 'bottom' : 'top';
      
      // Determine horizontal position to avoid cutoffs
      let horizontal: 'left' | 'center' | 'right' = 'center';
      
      // Check if centered tooltip would go off right edge
      if (triggerRect.left + tooltipWidth/2 > viewportWidth - 10) {
        horizontal = 'right';
      }
      // Check if centered tooltip would go off left edge  
      else if (triggerRect.left - tooltipWidth/2 < 10) {
        horizontal = 'left';
      }
      
      // Calculate fixed position
      let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
      if (horizontal === 'left') {
        left = triggerRect.left;
      } else if (horizontal === 'right') {
        left = triggerRect.right - tooltipWidth;
      }
      
      const top = vertical === 'top' 
        ? triggerRect.top - tooltipHeight - 4
        : triggerRect.bottom + 4;
      
      setPosition({ vertical, horizontal });
      setTooltipStyle({
        position: 'fixed',
        left: `${Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10))}px`,
        top: `${Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10))}px`,
        zIndex: 9999
      });
    }
  }, [isOpen]);

  const content = tooltipContent[metric];

  return (
    <div className="inline-flex items-center gap-1">
      {children}
      <div className="relative inline-flex items-center">
        <button
          ref={triggerRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Clear any pending close timeout when clicking
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
            setIsOpen(!isOpen);
          }}
          onMouseEnter={() => {
            // Clear any pending close timeout
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
            setIsOpen(true);
          }}
          onMouseLeave={() => {
            // Add 3-second delay before closing
            closeTimeoutRef.current = setTimeout(() => {
              setIsOpen(false);
            }, 3000);
          }}
          className="p-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={`Learn more about ${content.title}`}
        >
          <Info className="h-3 w-3" />
        </button>
        
        {isOpen && (
          <div
            ref={tooltipRef}
            style={tooltipStyle}
            className="w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm"
            onMouseEnter={() => {
              // Clear timeout when hovering over tooltip
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
              }
            }}
            onMouseLeave={() => {
              // Start close timeout when leaving tooltip
              closeTimeoutRef.current = setTimeout(() => {
                setIsOpen(false);
              }, 3000);
            }}
          >
            <div className="font-semibold text-gray-900 mb-1">{content.title}</div>
            <div className="text-gray-600 text-xs leading-relaxed">{content.description}</div>
          </div>
        )}
      </div>
    </div>
  );
};