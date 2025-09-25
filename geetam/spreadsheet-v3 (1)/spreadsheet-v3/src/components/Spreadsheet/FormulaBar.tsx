import React, { useState, useEffect } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { getCellName } from '../../utils/formulaEngine';

const formulaSuggestions = [
  '=SUM(', '=AVERAGE(', '=MIN(', '=MAX(', '=COUNT(', '=PRODUCT(',
  '=IF(', '=ROUND(', '=ABS(', '=SQRT(', '=POWER(', '=TODAY()', '=NOW()',
  '=CONCATENATE(', '=VLOOKUP('
];

export const FormulaBar: React.FC = () => {
  const { sheets, activeSheet, selection, updateCell } = useSpreadsheetStore();
  const [formulaInput, setFormulaInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const currentCell = selection?.current?.cell;
  const cellName = currentCell ? getCellName(currentCell[0], currentCell[1]) : 'A1';

  useEffect(() => {
    if (currentCell) {
      const [col, row] = currentCell;
      const cell = sheets[activeSheet]?.[row]?.[col];
      setFormulaInput(cell?.formula || cell?.value || '');
    }
  }, [currentCell, sheets, activeSheet]);

  const updateSuggestions = (value: string) => {
    if (value.startsWith('=')) {
      const filtered = formulaSuggestions.filter(s =>
        s.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setFormulaInput(value);
    updateSuggestions(value);
  };

  const handleSubmit = () => {
    if (currentCell) {
      const [col, row] = currentCell;
      if (formulaInput.startsWith('=')) {
        updateCell(row, col, { formula: formulaInput, value: formulaInput });
      } else {
        updateCell(row, col, { value: formulaInput });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (currentCell) {
        const [col, row] = currentCell;
        const cell = sheets[activeSheet]?.[row]?.[col];
        setFormulaInput(cell?.formula || cell?.value || '');
      }
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-2 relative">
      <div className="flex items-center gap-2">
        <div className="min-w-16 px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-center">
          {cellName}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => updateSuggestions(formulaInput)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            placeholder="Enter formula or text"
            className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFormulaInput(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};