import React, { useState } from 'react';
import { UnifiedSlider } from './UnifiedSlider';

export const TestSliderPage: React.FC = () => {
  const [value1, setValue1] = useState(5);
  const [value2, setValue2] = useState(5);
  const [value3, setValue3] = useState(5);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Slider Test Page</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Test 1: With showValue=true</h2>
          <UnifiedSlider
            value={value1}
            onChange={setValue1}
            leftLabel="Very lost"
            rightLabel="Totally prepared"
            variant="centered"
            showValue={true}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Test 2: With custom center label</h2>
          <UnifiedSlider
            value={value2}
            onChange={setValue2}
            leftLabel="In the dark"
            rightLabel="On top of it"
            centerLabel={`${value2}`}
            variant="centered"
            showValue={true}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Test 3: Separate value display</h2>
          <div className="text-center text-2xl font-bold text-purple-600 mb-2">
            {value3}
          </div>
          <UnifiedSlider
            value={value3}
            onChange={setValue3}
            leftLabel="Very shaky"
            rightLabel="Steady"
            variant="centered"
            showValue={false}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Current values: [{value1}, {value2}, {value3}]
        </p>
      </div>
    </div>
  );
};