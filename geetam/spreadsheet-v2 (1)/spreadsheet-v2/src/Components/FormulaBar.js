
// export default FormulaBar;
// Components/FormulaBar.js
// Components/FormulaBar.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as F from '@formulajs/formulajs'; // Make sure @formulajs/formulajs is installed

// Helper function to convert column index to letter (e.g., 0 -> A, 1 -> B)
const getColumnLetter = (colIndex) => {
  let letter = '';
  let tempIndex = colIndex;
  while (tempIndex >= 0) {
    letter = String.fromCharCode(65 + (tempIndex % 26)) + letter;
    tempIndex = Math.floor(tempIndex / 26) - 1;
  }
  return letter;
};

// Helper function to convert column letter to index (e.g., A -> 0, B -> 1)
const colLetterToIndex = (letter) => {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
};

// Helper function to get cell value, handling potential out-of-bounds
const getCellValue = (data, row, col) => {
  if (row >= 0 && row < data.length && col >= 0 && col < data[row].length) {
    const cell = data[row][col];
    if (typeof cell === 'string' && cell.trim().startsWith('=')) {
      return evaluateFormula(cell, data); // 👈 recursively evaluate
    }
    return cell;
  }
  return undefined;
};
// Helper function to get a range of values
const getRangeValues = (data, startRow, startCol, endRow, endCol) => {
  const values = [];
  for (let r = startRow; r <= endRow; r++) {
    const rowValues = [];
    for (let c = startCol; c <= endCol; c++) {
      rowValues.push(getCellValue(data, r, c));
    }
    values.push(rowValues);
  }
  return values.length === 1 && values[0].length === 1 ? values[0][0] : values;
};


export const evaluateFormula = (formula, data) => {
  if (!formula.startsWith('=')) return formula;

  let formulaBody = formula.substring(1).trim();

  const cellRefRegex = /[A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?/g;

  formulaBody = formulaBody.replace(cellRefRegex, (match) => {
    const parts = match.split(':');
    if (parts.length === 1) {
      const colLetter = match.match(/[A-Z]+/)[0];
      const rowNumber = parseInt(match.match(/[0-9]+/)[0], 10);
      const colIndex = colLetterToIndex(colLetter);
      const rowIndex = rowNumber - 1;
      const value = getCellValue(data, rowIndex, colIndex);
      return JSON.stringify(value);
    } else if (parts.length === 2) {
      const [startCell, endCell] = parts;
      const startColLetter = startCell.match(/[A-Z]+/)[0];
      const startRowNumber = parseInt(startCell.match(/[0-9]+/)[0], 10);
      const startColIndex = colLetterToIndex(startColLetter);
      const startRowIndex = startRowNumber - 1;

      const endColLetter = endCell.match(/[A-Z]+/)[0];
      const endRowNumber = parseInt(endCell.match(/[0-9]+/)[0], 10);
      const endColIndex = colLetterToIndex(endColLetter);
      const endRowIndex = endRowNumber - 1;

      let rangeValues = getRangeValues(data, startRowIndex, startColIndex, endRowIndex, endColIndex);
      rangeValues = rangeValues.flat().map(v => {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
      });

      return JSON.stringify(rangeValues);
    }
    return match;
  });

  // Safely replace known functions only
  const allFunctionNames = Object.keys(F);
  const functionCallRegex = /\b([A-Z_][A-Z0-9_]*)\s*\(/gi;

  formulaBody = formulaBody.replace(functionCallRegex, (match, funcName) => {
    const upperFunc = funcName.toUpperCase();
    if (allFunctionNames.includes(upperFunc)) {
      return `F.${upperFunc}(`;
    }
    return match;
  });

  try {
    const result = (function(F) {
      return eval(formulaBody);
    })(F);
    return result;
  } catch (error) {
    console.error("Formula evaluation error:", error);
    return "#ERROR!";
  }
};


const FormulaBar = ({ activeCell, data, setData, formulaBarValue, setFormulaBarValue, inputRefs }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const formulaInputRef = useRef(null);

  const allFunctions = Object.keys(F).filter(key => typeof F[key] === 'function');

  useEffect(() => {
    // Update formula bar when active cell changes
    const cellValue = data[activeCell.row - 1]?.[activeCell.col - 1] || '';
    setFormulaBarValue(cellValue);
  }, [activeCell, data, setFormulaBarValue]);

  const commitFormulaBarValue = useCallback(() => {
    // Only update cell data when the value is committed (on blur or Enter)
    setData((prev) => {
      const updated = [...prev];
      // Ensure the row exists before attempting to update it
      if (updated[activeCell.row - 1]) {
        updated[activeCell.row - 1] = [...updated[activeCell.row - 1]];
        updated[activeCell.row - 1][activeCell.col - 1] = formulaBarValue;
      }
      return updated;
    });
    // Blur the input to ensure App.js cell rendering re-evaluates
    // A small timeout helps ensure the state update propagates before attempting to blur,
    // though in many cases it might not be strictly necessary here due to React's batching.
    setTimeout(() => {
      formulaInputRef.current?.blur();
    }, 0);
  }, [activeCell, formulaBarValue, setData]);


  const handleFormulaInputChange = (e) => {
    const newValue = e.target.value;
    setFormulaBarValue(newValue); // Only update formula bar's local state immediately

    if (newValue.startsWith('=')) {
      const functionPart = newValue.substring(1).split('(')[0].toUpperCase();
      const filteredSuggestions = allFunctions.filter(func =>
        func.startsWith(functionPart)
      ).slice(0, 10);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]); // Clear suggestions if not a formula
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = useCallback((funcName) => {
    const newFormula = `=${funcName.toUpperCase()}()`;
    setFormulaBarValue(newFormula);

    // When a suggestion is clicked, commit the value immediately
    // This is because clicking a suggestion implies an intent to complete the input
    setData((prev) => {
      const updated = [...prev];
      if (updated[activeCell.row - 1]) {
        updated[activeCell.row - 1] = [...updated[activeCell.row - 1]];
        updated[activeCell.row - 1][activeCell.col - 1] = newFormula;
      }
      return updated;
    });

    setShowSuggestions(false);

    // Place cursor inside the parenthesis for function arguments
    setTimeout(() => {
      if (formulaInputRef.current) {
        const cursorPosition = newFormula.length - 1; // Position before the closing parenthesis
        formulaInputRef.current.focus();
        formulaInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }, [activeCell, setData, setFormulaBarValue]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitFormulaBarValue(); // Commit on Enter
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false); // Hide suggestions on Escape
      formulaInputRef.current?.blur(); // Blur formula bar
    }
  }, [commitFormulaBarValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
          formulaInputRef.current && !formulaInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const nameBoxDisplay = activeCell.row > 0 && activeCell.col > 0
    ? `${getColumnLetter(activeCell.col - 1)}${activeCell.row}`
    : '';

  return (
    <div className="relative w-full px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="font-bold px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm w-16 text-center select-none">
          {nameBoxDisplay}
        </div>
        <span className="font-bold text-gray-600">fx</span>
        <input
          ref={formulaInputRef}
          type="text"
          value={formulaBarValue}
          onChange={handleFormulaInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            // When focusing the formula bar, ensure the active cell's raw value is loaded
            const cellValue = data[activeCell.row - 1]?.[activeCell.col - 1] || '';
            setFormulaBarValue(cellValue);
          }}
          onBlur={commitFormulaBarValue} // Commit on blur
          className="flex-grow p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-mono"
          placeholder="Enter formula or text"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute z-20 bg-white border border-gray-300 rounded-md shadow-lg mt-1 w-full max-h-60 overflow-y-auto"
          style={{ top: 'calc(100% + 5px)', left: '0', width: '98%' }}
        >
          {suggestions.map((funcName) => (
            <div
              key={funcName}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur on click so suggestion can be selected
                handleSuggestionClick(funcName);
              }}
            >
              <span className="font-semibold">{funcName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormulaBar;