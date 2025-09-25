import React, { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { X } from 'lucide-react';

interface DataValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataValidationDialog: React.FC<DataValidationDialogProps> = ({ isOpen, onClose }) => {
  const { selection, updateCellRange, pushToUndoStack, theme } = useSpreadsheetStore();
  const [validationType, setValidationType] = useState<'list' | 'number' | 'date' | 'custom'>('list');
  const [criteria, setCriteria] = useState('');
  const [errorMessage, setErrorMessage] = useState('Invalid input');

  const handleApply = () => {
    if (!selection?.current?.range) {
      alert('Please select a range first');
      return;
    }

    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    
    const validation = {
      type: validationType,
      criteria: validationType === 'list' ? criteria.split(',').map(s => s.trim()) : criteria,
      errorMessage
    };

    updateCellRange(y, x, y + height - 1, x + width - 1, { validation });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-96 ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Data Validation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Validation Type</label>
            <select
              value={validationType}
              onChange={(e) => setValidationType(e.target.value as any)}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="list">List of items</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="custom">Custom formula</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {validationType === 'list' ? 'Items (comma-separated)' : 'Criteria'}
            </label>
            <input
              type="text"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder={
                validationType === 'list' 
                  ? 'Option 1, Option 2, Option 3' 
                  : validationType === 'number'
                  ? '>0'
                  : validationType === 'date'
                  ? '>2024-01-01'
                  : '=A1>0'
              }
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Error Message</label>
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded hover:bg-gray-50 ${
              theme === 'dark' 
                ? 'border-gray-600 text-white hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};