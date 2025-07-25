import React, { useState } from 'react';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/api';

interface MedicationStatusManagerProps {
  currentStatus?: string;
  onStatusUpdate?: (newStatus: string) => void;
  isInline?: boolean; // Whether this is part of a check-in form
}

const statusOptions = [
  { value: 'taking', label: 'Currently taking medications', icon: '💊' },
  { value: 'starting_soon', label: 'Starting medications soon', icon: '🔜' },
  { value: 'not_taking', label: 'Not taking medications yet', icon: '⏳' },
  { value: 'between_cycles', label: 'Between medication cycles', icon: '🔄' },
  { value: 'finished_treatment', label: 'Finished treatment', icon: '✅' }
];

export const MedicationStatusManager: React.FC<MedicationStatusManagerProps> = ({
  currentStatus,
  onStatusUpdate,
  isInline = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('no_change');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  const handleStatusUpdate = async () => {
    if (selectedStatus === 'no_change' || !selectedStatus) return;
    
    setIsUpdating(true);
    
    try {
      const response = await apiClient.makeRequest('/api/users/medication-status', {
        method: 'PATCH',
        body: JSON.stringify({ medication_status: selectedStatus }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        setUpdateComplete(true);
        onStatusUpdate?.(selectedStatus);
        console.log('✅ Medication status updated:', selectedStatus);
      } else {
        throw new Error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Failed to update medication status:', error);
      alert('Failed to update medication status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === currentStatus);
    return option ? option.label : currentStatus;
  };

  if (updateComplete) {
    return (
      <div className={`${isInline ? 'p-3' : 'p-6'} bg-green-50 border border-green-200 rounded-lg`}>
        <div className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Status updated successfully!</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Your medication status has been updated. Future questions will be personalized accordingly.
        </p>
      </div>
    );
  }

  return (
    <div className={`${isInline ? 'p-3' : 'p-6'} bg-blue-50 border border-blue-200 rounded-lg`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-2">
            Update Your Medication Status
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            {currentStatus ? 
              `We currently have you listed as "${getCurrentStatusLabel()}". Has this changed?` :
              'Help us personalize your experience by sharing your current medication status.'
            }
          </p>
          
          <div className="space-y-2 mb-4">
            {currentStatus && (
              <label className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="medication_status"
                  value="no_change"
                  checked={selectedStatus === 'no_change'}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-2xl">✅</span>
                <span className="text-sm">No change - still {getCurrentStatusLabel()}</span>
              </label>
            )}
            
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="medication_status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-2xl">{option.icon}</span>
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || selectedStatus === 'no_change'}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              size="sm"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
            {currentStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStatus('no_change')}
                className="text-sm"
              >
                Keep Current
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 