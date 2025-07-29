// Centered Slider Component - Visually centers at 5 for better UX
import React from 'react';

interface CenteredSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  hasInteracted?: boolean;
  className?: string;
}

export const CenteredSlider: React.FC<CenteredSliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  hasInteracted = false,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  // Note: transformValueToPosition was removed as it wasn't needed
  // The visual centering is handled by getTrackFillPercentage below

  // Calculate the visual percentage for the track fill
  const getTrackFillPercentage = (val: number): number => {
    // We want 5 to appear at 50%
    if (val <= 5) {
      // 1-5 should fill 0-50%
      return ((val - 1) / 4) * 50;
    } else {
      // 6-10 should fill 50-100%
      return 50 + ((val - 5) / 5) * 50;
    }
  };

  const trackFillPercentage = getTrackFillPercentage(value);
  const isGrayedOut = !hasInteracted;

  return (
    <div className={`relative ${className} h-2`}>
      {/* Custom styled slider using absolute positioning */}
      <div className="absolute inset-0">
        {/* Background track */}
        <div className={`absolute inset-0 h-2 rounded ${isGrayedOut ? 'bg-gray-200' : 'bg-purple-200'}`} />
        
        {/* Filled portion of track */}
        <div 
          className={`absolute left-0 top-0 h-2 rounded-l transition-all duration-200 ${
            isGrayedOut ? 'bg-gray-400' : 'bg-[#ff6f61]'
          }`}
          style={{ width: `${trackFillPercentage}%` }}
        />
        
        {/* Center marker at visual 50% (value 5) */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-3 ${
            isGrayedOut ? 'bg-gray-300' : 'bg-purple-300'
          } opacity-40`}
          style={{ left: '50%' }}
        />
        
        {/* Thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-200 ${
            isGrayedOut ? 'bg-gray-400' : 'bg-[#ff6f61] hover:scale-110'
          }`}
          style={{ left: `${trackFillPercentage}%` }}
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
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        style={{
          // Use a custom data attribute to override browser styling
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none'
        }}
      />
    </div>
  );
};