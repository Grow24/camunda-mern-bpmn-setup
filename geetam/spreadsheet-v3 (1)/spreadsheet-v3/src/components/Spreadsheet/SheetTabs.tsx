import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';

export const SheetTabs: React.FC = () => {
  const { sheets, activeSheet, setActiveSheet, addSheet, deleteSheet, renameSheet } = useSpreadsheetStore();
  const [editingSheet, setEditingSheet] = useState<string | null>(null);
  const [newSheetName, setNewSheetName] = useState('');

  const handleAddSheet = () => {
    const sheetNames = Object.keys(sheets);
    let newName = `Sheet${sheetNames.length + 1}`;
    let counter = sheetNames.length + 1;
    
    while (sheets[newName]) {
      counter++;
      newName = `Sheet${counter}`;
    }
    
    addSheet(newName);
  };

  const handleDeleteSheet = (sheetName: string) => {
    if (Object.keys(sheets).length > 1) {
      deleteSheet(sheetName);
    }
  };

  const startEditing = (sheetName: string) => {
    setEditingSheet(sheetName);
    setNewSheetName(sheetName);
  };

  const saveSheetName = () => {
    if (editingSheet && newSheetName.trim() && newSheetName !== editingSheet) {
      if (!sheets[newSheetName]) {
        renameSheet(editingSheet, newSheetName.trim());
      }
    }
    setEditingSheet(null);
    setNewSheetName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveSheetName();
    } else if (e.key === 'Escape') {
      setEditingSheet(null);
      setNewSheetName('');
    }
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-center gap-1 overflow-x-auto">
      {Object.keys(sheets).map((sheetName) => (
        <div
          key={sheetName}
          className={`flex items-center gap-1 px-3 py-2 rounded-t border-b-2 cursor-pointer transition-colors ${
            activeSheet === sheetName
              ? 'bg-white border-blue-500 text-blue-600'
              : 'bg-gray-100 border-transparent hover:bg-gray-200'
          }`}
        >
          {editingSheet === sheetName ? (
            <input
              type="text"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onBlur={saveSheetName}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-sm min-w-16"
              autoFocus
            />
          ) : (
            <>
              <span
                onClick={() => setActiveSheet(sheetName)}
                onDoubleClick={() => startEditing(sheetName)}
                className="text-sm font-medium"
              >
                {sheetName}
              </span>
              {Object.keys(sheets).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSheet(sheetName);
                  }}
                  className="p-1 rounded hover:bg-gray-300 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      
      <button
        onClick={handleAddSheet}
        className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-200 text-gray-600"
        title="Add Sheet"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};