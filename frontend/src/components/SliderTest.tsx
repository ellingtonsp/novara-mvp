import React, { useState } from 'react';
import { CenteredSlider } from './CenteredSlider';

export const SliderTest: React.FC = () => {
  const [value1, setValue1] = useState(5);
  const [value2, setValue2] = useState(5);
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Slider Centering Test</h2>
      
      <div className="space-y-4">
        <h3 className="font-semibold">Standard Slider (for comparison)</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>1</span>
            <span>Current: {value1}</span>
            <span>10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={value1}
            onChange={(e) => setValue1(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Centered Slider (5 at visual center)</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Low</span>
            <span className={hasInteracted ? 'text-purple-600 font-bold' : 'text-gray-400'}>
              {hasInteracted ? value2 : '—'}
            </span>
            <span>High</span>
          </div>
          <CenteredSlider
            value={value2}
            onChange={(val) => {
              setValue2(val);
              setHasInteracted(true);
            }}
            hasInteracted={hasInteracted}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span className="ml-[12.5%]">2</span>
            <span className="ml-[12.5%]">3</span>
            <span className="ml-[12.5%]">4</span>
            <span className="ml-[12.5%] font-bold text-purple-500">5</span>
            <span className="ml-[10%]">6</span>
            <span className="ml-[10%]">7</span>
            <span className="ml-[10%]">8</span>
            <span className="ml-[10%]">9</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-purple-100 rounded-lg">
        <p className="text-sm text-purple-800">
          The centered slider visually places 5 at the 50% mark, even though it's not the mathematical midpoint of 1-10.
          This creates a more intuitive experience where the default position appears centered.
        </p>
      </div>
    </div>
  );
};