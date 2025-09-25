import React from 'react';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { FormulaBar } from './FormulaBar';
import { ToolBar } from './ToolBar';
import { SheetTabs } from './SheetTabs';
import { MenuBar } from './MenuBar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';

export const Spreadsheet: React.FC = () => {
  useKeyboardShortcuts();
  
  const { showFormulaBar, theme } = useSpreadsheetStore();

  return (
    <div className={`flex flex-col h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Menu Bar */}
      <MenuBar />

      {/* Toolbar */}
      <ToolBar />

      {/* Formula Bar */}
      {showFormulaBar && <FormulaBar />}

      {/* Main Grid */}
      <SpreadsheetGrid />

      {/* Sheet Tabs */}
      <SheetTabs />
    </div>
  );
};