import React, { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { X, Filter } from 'lucide-react';

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({ isOpen, onClose }) => {
  const { sheets, activeSheet, selection, updateCellRange, pushToUndoStack, theme } = useSpreadsheetStore();
  const [filterColumn, setFilterColumn] = useState(0);
  const [filterValue, setFilterValue] = useState('');
  const [filterType, setFilterType] = useState<'contains' | 'equals' | 'greater' | 'less'>('contains');

  const handleApplyFilter = () => {
    if (!selection?.current?.range) {
      alert('Please select a range first');
      return;
    }

    const { x, y, width, height } = selection.current.range;
    const currentSheet = sheets[activeSheet];
    
    // Simple filter implementation - hide rows that don't match
    for (let row = y; row < y + height; row++) {
      const cellValue = currentSheet[row]?.[x + filterColumn]?.value || '';
      let shouldShow = false;

      switch (filterType) {
        case 'contains':
          shouldShow = cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
          break;
        case 'equals':
          shouldShow = cellValue.toString() === filterValue;
          break;
        case 'greater':
          shouldShow = parseFloat(cellValue.toString()) > parseFloat(filterValue);
          break;
        case 'less':
          shouldShow = parseFloat(cellValue.toString()) < parseFloat(filterValue);
          break;
      }

      // In a real implementation, you'd hide/show rows
      // For now, we'll just highlight matching cells
      if (shouldShow) {
        updateCellRange(row, x, row, x + width - 1, { 
          bgColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' 
        });
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-96 ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <h3 className="text-lg font-semibold">Filter Data</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter Column</label>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(parseInt(e.target.value))}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i}>Column {String.fromCharCode(65 + i)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="contains">Contains</option>
              <option value="equals">Equals</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Value</label>
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="Enter filter value"
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
            onClick={handleApplyFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};