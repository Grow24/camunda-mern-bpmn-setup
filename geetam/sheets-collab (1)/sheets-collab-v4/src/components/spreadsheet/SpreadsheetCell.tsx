import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SpreadsheetCellProps {
  cellId: string;
  value: any;
  formula?: string;
  style?: any;
  isSelected: boolean;
  onClick: () => void;
  onChange: (value: any, formula?: string) => void;
}

export function SpreadsheetCell({
  cellId,
  value,
  formula,
  style,
  isSelected,
  onClick,
  onChange
}: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { typingIndicators, userColors } = useSelector((state: RootState) => state.collaboration);
  
  // Check if someone is typing in this cell
  const typingUser = typingIndicators.find(t => t.cellId === cellId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(formula || value || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  const handleSave = () => {
    const isFormula = editValue.startsWith('=');
    if (isFormula) {
      onChange(evaluateFormula(editValue), editValue);
    } else {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const evaluateFormula = (formula: string): any => {
    // Simple formula evaluation - in a real app, you'd use a proper formula engine
    try {
      if (formula.startsWith('=')) {
        const expression = formula.slice(1);
        // Basic math operations only for demo
        if (/^[\d+\-*/().\s]+$/.test(expression)) {
          return eval(expression);
        }
      }
      return formula;
    } catch {
      return '#ERROR';
    }
  };

  const displayValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <div
      className={`
        w-30 h-8 border-r border-b border-gray-200 relative cursor-cell
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
        ${typingUser ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={style}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-2 text-sm border-none outline-none bg-white"
        />
      ) : (
        <div className="w-full h-full px-2 flex items-center text-sm truncate">
          {displayValue}
        </div>
      )}

      {/* Typing indicator */}
      {typingUser && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: userColors[typingUser.userId] }}
          title={`${typingUser.name} is typing`}
        />
      )}
    </div>
  );
}