import React from 'react';
import styles from './UnifiedSlider.module.css';

interface UnifiedSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  hasInteracted?: boolean;
  className?: string;
  showValue?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  centerLabel?: string;
  variant?: 'centered' | 'linear';
}

export const UnifiedSlider: React.FC<UnifiedSliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  hasInteracted = true,
  className = '',
  showValue = true,
  leftLabel,
  rightLabel,
  centerLabel,
  variant = 'centered'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  // Calculate visual percentage based on variant
  const getTrackFillPercentage = (val: number): number => {
    if (variant === 'centered') {
      // Centered variant: 5 appears at 50%
      // For a 1-10 scale, we need to map:
      // 1 -> 0%, 5 -> 50%, 10 -> 100%
      if (val <= 5) {
        // Map 1-5 to 0-50%
        return ((val - 1) / 4) * 50;
      } else {
        // Map 6-10 to 50-100%
        return 50 + ((val - 5) / 5) * 50;
      }
    } else {
      // Linear variant: standard percentage
      return ((val - min) / (max - min)) * 100;
    }
  };

  const trackFillPercentage = getTrackFillPercentage(value);
  const isGrayedOut = !hasInteracted;

  return (
    <div className={`w-full ${className}`}>
      {/* Value display */}
      {showValue && (
        <div className="text-center mb-2">
          <span className={`text-3xl font-bold ${isGrayedOut ? 'text-gray-400' : 'text-purple-600'}`}>
            {centerLabel || value}
          </span>
        </div>
      )}
      
      {/* Labels */}
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{leftLabel || ''}</span>
          <span>{rightLabel || ''}</span>
        </div>
      )}

      {/* Slider container */}
      <div className="relative h-12 flex items-center">
        {/* Custom styled track */}
        <div className="absolute inset-x-0 h-2 top-1/2 -translate-y-1/2">
          {/* Background track */}
          <div className={`absolute inset-0 h-2 rounded-full ${
            isGrayedOut ? 'bg-gray-200' : 'bg-purple-200'
          }`} />
          
          {/* Filled portion */}
          <div 
            className={`absolute left-0 top-0 h-2 rounded-full transition-all duration-200 ${
              isGrayedOut ? 'bg-gray-400' : 'bg-[#ff6f61]'
            }`}
            style={{ width: `${trackFillPercentage}%` }}
          />
          
          {/* Center marker removed - was causing visual artifacts */}
        </div>

        {/* Thumb - positioned absolutely to ensure proper centering */}
        <div 
          className="absolute top-1/2 -translate-y-1/2"
          style={{ 
            left: `${trackFillPercentage}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className={`w-6 h-6 rounded-full border-2 border-white shadow-md transition-all duration-200 ${
              disabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isGrayedOut 
                  ? 'bg-gray-400 cursor-pointer hover:scale-110' 
                  : 'bg-[#ff6f61] cursor-pointer hover:scale-110 active:scale-95'
            }`}
          />
        </div>
        
        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 ${styles['slider-input']}`}
          aria-label={`Slider from ${min} to ${max}, current value ${value}`}
        />
      </div>
    </div>
  );
};