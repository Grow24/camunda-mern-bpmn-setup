// Components/UndoRedoToolbar.js
import React from 'react';

const UndoRedoToolbar = ({ onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-200 px-4 py-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`px-3 py-1 rounded ${canUndo ? 'bg-blue-500 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
      >
        ↶
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`px-3 py-1 rounded ${canRedo ? 'bg-green-500 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
      >
        ↷
      </button>
    </div>
  );
};

export default UndoRedoToolbar;
