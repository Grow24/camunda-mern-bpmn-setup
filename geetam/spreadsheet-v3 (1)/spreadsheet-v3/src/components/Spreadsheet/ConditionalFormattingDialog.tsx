import React, { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { X, Palette } from 'lucide-react';

interface ConditionalFormattingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConditionalFormattingDialog: React.FC<ConditionalFormattingDialogProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { selection, updateCellRange, pushToUndoStack, theme } = useSpreadsheetStore();
  const [conditionType, setConditionType] = useState<'cellValue' | 'formula'>('cellValue');
  const [operator, setOperator] = useState<'greaterThan' | 'lessThan' | 'between' | 'equal' | 'contains'>('greaterThan');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [bgColor, setBgColor] = useState('#ffeb3b');
  const [textColor, setTextColor] = useState('#000000');
  const [bold, setBold] = useState(false);

  const handleApply = () => {
    if (!selection?.current?.range) {
      alert('Please select a range first');
      return;
    }

    const { x, y, width, height } = selection.current.range;
    console.log(`Applying conditional formatting to range: (${y}, ${x}) to (${y + height - 1}, ${x + width - 1})`);
    pushToUndoStack();
    
    const conditionalFormatting = {
      type: conditionType,
      operator,
      value1,
      value2: operator === 'between' ? value2 : undefined,
      format: {
        bgColor,
        textColor,
        bold
      }
    };

    updateCellRange(y, x, y + height - 1, x + width - 1, { conditionalFormatting });
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
            <Palette size={20} />
            <h3 className="text-lg font-semibold">Conditional Formatting</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Condition Type</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as any)}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="cellValue">Cell value</option>
              <option value="formula">Custom formula</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="greaterThan">Greater than</option>
              <option value="lessThan">Less than</option>
              <option value="equal">Equal to</option>
              <option value="between">Between</option>
              <option value="contains">Contains text</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Value</label>
            <input
              type="text"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="Enter value"
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {operator === 'between' && (
            <div>
              <label className="block text-sm font-medium mb-2">Second Value</label>
              <input
                type="text"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                placeholder="Enter second value"
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Background Color</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="bold"
              checked={bold}
              onChange={(e) => setBold(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="bold" className="text-sm">Bold text</label>
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