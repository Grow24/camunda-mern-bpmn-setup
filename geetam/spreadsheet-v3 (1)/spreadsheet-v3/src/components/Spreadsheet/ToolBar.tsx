import React, { useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Save, Download, Upload, Plus, Minus, ZoomIn, ZoomOut, Palette, ListOrdered as BorderAll, Link, MessageSquare, Merge, WrapText, Filter, SortAsc, SortDesc, Percent, DollarSign, Hash } from 'lucide-react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { ColorPicker } from '../UI/ColorPicker';
import { DropdownMenu } from '../UI/DropdownMenu';
import { DataValidationDialog } from './DataValidationDialog';
import { FilterDialog } from './FilterDialog';
import { ConditionalFormattingDialog } from './ConditionalFormattingDialog';

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Georgia, serif',
  'Palatino, serif',
  'Garamond, serif',
  'Bookman, serif',
  'Comic Sans MS, cursive',
  'Trebuchet MS, sans-serif',
  'Arial Black, sans-serif',
  'Impact, sans-serif',
  'Lucida Sans Unicode, sans-serif',
  'Tahoma, sans-serif',
  'Lucida Console, monospace',
  'Monaco, monospace',
  'Brush Script MT, cursive',
  'Lucida Handwriting, cursive',
  'Copperplate, fantasy',
  'Papyrus, fantasy',
  'Optima, sans-serif',
  'Gill Sans, sans-serif',
  'Avenir, sans-serif',
  'Futura, sans-serif',
  'Helvetica Neue, sans-serif',
  'Calibri, sans-serif',
  'Cambria, serif',
  'Candara, sans-serif',
  'Consolas, monospace',
  'Constantia, serif',
  'Corbel, sans-serif',
  'Franklin Gothic Medium, sans-serif',
  'Segoe UI, sans-serif',
  'Century Gothic, sans-serif',
  'Myriad Pro, sans-serif',
  'Minion Pro, serif',
  'Adobe Garamond Pro, serif',
  'Trajan Pro, serif',
  'Warnock Pro, serif',
  'Source Sans Pro, sans-serif',
  'Source Serif Pro, serif',
  'Open Sans, sans-serif',
  'Roboto, sans-serif',
  'Lato, sans-serif',
  'Montserrat, sans-serif',
  'Oswald, sans-serif',
  'Raleway, sans-serif',
  'PT Sans, sans-serif',
  'PT Serif, serif',
  'Ubuntu, sans-serif',
  'Droid Sans, sans-serif',
  'Droid Serif, serif',
  'Noto Sans, sans-serif',
  'Noto Serif, serif',
  'Playfair Display, serif',
  'Merriweather, serif',
  'Lora, serif',
  'Crimson Text, serif',
  'Old Standard TT, serif',
  'EB Garamond, serif',
  'Libre Baskerville, serif',
  'Vollkorn, serif',
  'Alegreya, serif',
  'Neuton, serif',
  'Cardo, serif',
  'Gentium Basic, serif',
  'Sorts Mill Goudy, serif',
  'Fanwood Text, serif',
  'IM Fell English, serif',
  'UnifrakturMaguntia, cursive',
  'Cinzel, serif',
  'Cormorant Garamond, serif',
  'Spectral, serif',
  'Source Code Pro, monospace',
  'Inconsolata, monospace',
  'Ubuntu Mono, monospace',
  'Droid Sans Mono, monospace',
  'PT Mono, monospace',
  'Anonymous Pro, monospace',
  'Cousine, monospace',
  'Cutive Mono, monospace',
  'Nova Mono, monospace',
  'Oxygen Mono, monospace',
  'Roboto Mono, monospace',
  'Space Mono, monospace',
  'VT323, monospace',
  'Fira Code, monospace',
  'JetBrains Mono, monospace',
  'Cascadia Code, monospace',
  'SF Mono, monospace',
  'Menlo, monospace',
  'DejaVu Sans Mono, monospace',
  'Liberation Mono, monospace',
  'Nimbus Mono L, monospace',
  'FreeMono, monospace',
  'Andale Mono, monospace',
  'Lucida Typewriter, monospace',
  'Courier, monospace',
  'American Typewriter, serif',
  'Andale Mono, monospace',
  'Apple Chancery, cursive',
  'Bradley Hand, cursive',
  'Brush Script Std, cursive',
  'Chalkboard, fantasy',
  'ChalkboardSE-Regular, fantasy',
  'Marker Felt, fantasy',
  'Noteworthy, sans-serif',
  'Zapfino, cursive',
  'Big Caslon, serif',
  'Bodoni 72, serif',
  'Bodoni 72 Oldstyle, serif',
  'Bodoni 72 Smallcaps, serif',
  'Bradley Hand ITC, cursive',
  'Brush Script MT, cursive',
  'Chalkduster, fantasy',
  'Cochin, serif',
  'Copperplate, fantasy',
  'Didot, serif',
  'Euphemia UCAS, sans-serif',
  'Futura, sans-serif',
  'Geeza Pro, sans-serif',
  'Geneva, sans-serif',
  'GillSans, sans-serif',
  'Helvetica, sans-serif',
  'Helvetica Neue, sans-serif',
  'Herculanum, fantasy',
  'Hoefler Text, serif',
  'Impact, sans-serif',
  'Kailasa, sans-serif',
  'Krungthep, sans-serif',
  'Lucida Grande, sans-serif',
  'Luminari, fantasy',
  'Marker Felt, fantasy',
  'Menlo, monospace',
  'Monaco, monospace',
  'Noteworthy, sans-serif',
  'Optima, sans-serif',
  'Palatino, serif',
  'Papyrus, fantasy',
  'Phosphate, fantasy',
  'Rockwell, serif',
  'Savoye LET, cursive',
  'SignPainter, fantasy',
  'Skia, sans-serif',
  'Snell Roundhand, cursive',
  'Tahoma, sans-serif',
  'Times, serif',
  'Times New Roman, serif',
  'Trattatello, cursive',
  'Trebuchet MS, sans-serif',
  'Verdana, sans-serif',
  'Zapfino, cursive'
];

export const ToolBar: React.FC = () => {
  const { 
    sheets, 
    activeSheet, 
    selection, 
    updateCell, 
    updateCellRange,
    undo, 
    redo, 
    undoStack, 
    redoStack,
    zoom,
    setZoom,
    pushToUndoStack,
    theme
  } = useSpreadsheetStore();

  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showNumberFormatMenu, setShowNumberFormatMenu] = useState(false);
  const [showDataValidationDialog, setShowDataValidationDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showConditionalFormattingDialog, setShowConditionalFormattingDialog] = useState(false);

  const getSelectedRange = () => {
    if (!selection?.current?.range) return null;
    const { x, y, width, height } = selection.current.range;
    return {
      startRow: y,
      startCol: x,
      endRow: y + height - 1,
      endCol: x + width - 1
    };
  };

  const applyFormatting = (property: string, value: any) => {
    const range = getSelectedRange();
    if (!range) return;
    
    pushToUndoStack();
    updateCellRange(range.startRow, range.startCol, range.endRow, range.endCol, { [property]: value });
  };

  const toggleFormatting = (property: string) => {
    const range = getSelectedRange();
    if (!range) return;
    
    // Check if all cells in range have this property
    const currentSheet = sheets[activeSheet];
    let allHaveProperty = true;
    
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const cell = currentSheet[row]?.[col];
        if (!cell?.[property as keyof typeof cell]) {
          allHaveProperty = false;
          break;
        }
      }
      if (!allHaveProperty) break;
    }
    
    pushToUndoStack();
    updateCellRange(range.startRow, range.startCol, range.endRow, range.endCol, { 
      [property]: !allHaveProperty 
    });
  };

  const numberFormatItems = [
    { label: 'General', onClick: () => applyFormatting('numberFormat', 'general') },
    { label: 'Currency', onClick: () => applyFormatting('numberFormat', 'currency') },
    { label: 'Percentage', onClick: () => applyFormatting('numberFormat', 'percentage') },
    { label: 'Date', onClick: () => applyFormatting('numberFormat', 'date') },
    { label: 'Time', onClick: () => applyFormatting('numberFormat', 'time') }
  ];

  const borderItems = [
    { label: 'All borders', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Outer borders', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Inner borders', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Top border', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Bottom border', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Left border', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'Right border', onClick: () => applyFormatting('borderColor', '#000000') },
    { label: 'No border', onClick: () => applyFormatting('borderColor', 'transparent') }
  ];

  return (
    <div className={`border-b px-4 py-2 flex items-center gap-2 flex-wrap ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Print */}
      <button
        onClick={() => window.print()}
        className={`p-2 rounded hover:bg-gray-100 ${
          theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
        }`}
        title="Print"
      >
        📄
      </button>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(Math.max(25, zoom - 25))}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <select
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className={`px-2 py-1 border rounded text-sm ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value={25}>25%</option>
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
        <button
          onClick={() => setZoom(Math.min(200, zoom + 25))}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Number Format */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => applyFormatting('numberFormat', 'currency')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Currency"
        >
          <DollarSign size={16} />
        </button>
        <button
          onClick={() => applyFormatting('numberFormat', 'percentage')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Percentage"
        >
          <Percent size={16} />
        </button>
        <DropdownMenu
          trigger={
            <button className={`p-2 rounded hover:bg-gray-100 ${
              theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
            }`}>
              123
            </button>
          }
          items={numberFormatItems}
        />
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Font Formatting */}
      <div className="flex items-center gap-1">
        <select
          onChange={(e) => applyFormatting('fontFamily', e.target.value)}
          className={`px-2 py-1 border rounded text-sm ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          defaultValue="Arial, sans-serif"
          style={{ minWidth: '140px' }}
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font.split(',')[0]}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => applyFormatting('fontSize', parseInt(e.target.value))}
          className={`px-2 py-1 border rounded text-sm w-16 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          defaultValue="14"
        >
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Text Style */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggleFormatting('bold')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => toggleFormatting('italic')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => toggleFormatting('underline')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={() => toggleFormatting('strikethrough')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => applyFormatting('alignment', 'left')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => applyFormatting('alignment', 'center')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => applyFormatting('alignment', 'right')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Colors */}
      <div className="flex items-center gap-2">
        <ColorPicker
          value="#000000"
          onChange={(color) => applyFormatting('textColor', color)}
          label="A"
        />
        <ColorPicker
          value="#ffffff"
          onChange={(color) => applyFormatting('bgColor', color)}
          label="🎨"
        />
        <ColorPicker
          value="#000000"
          onChange={(color) => applyFormatting('borderColor', color)}
          label="⬜"
        />
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Borders */}
      <DropdownMenu
        trigger={
          <button className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}>
            <BorderAll size={16} />
          </button>
        }
        items={borderItems}
      />

      {/* Merge Cells */}
      <button
        onClick={() => console.log('Merge cells')}
        className={`p-2 rounded hover:bg-gray-100 ${
          theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
        }`}
        title="Merge cells"
      >
        <Merge size={16} />
      </button>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Insert */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => console.log('Insert link')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Insert link"
        >
          <Link size={16} />
        </button>
        <button
          onClick={() => console.log('Insert comment')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Insert comment"
        >
          <MessageSquare size={16} />
        </button>
      </div>

      <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

      {/* Data */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowFilterDialog(true)}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Filter"
        >
          <Filter size={16} />
        </button>
        <button
          onClick={() => setShowDataValidationDialog(true)}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Data Validation"
        >
          ✓
        </button>
        <button
          onClick={() => setShowConditionalFormattingDialog(true)}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Conditional Formatting"
        >
          🎨
        </button>
        <button
          onClick={() => console.log('Sort ascending')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Sort A-Z"
        >
          <SortAsc size={16} />
        </button>
        <button
          onClick={() => console.log('Sort descending')}
          className={`p-2 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}
          title="Sort Z-A"
        >
          <SortDesc size={16} />
        </button>
      </div>

      {/* Dialogs */}
      <DataValidationDialog 
        isOpen={showDataValidationDialog} 
        onClose={() => setShowDataValidationDialog(false)} 
      />
      <FilterDialog 
        isOpen={showFilterDialog} 
        onClose={() => setShowFilterDialog(false)} 
      />
      <ConditionalFormattingDialog 
        isOpen={showConditionalFormattingDialog} 
        onClose={() => setShowConditionalFormattingDialog(false)} 
      />
    </div>
  );
};