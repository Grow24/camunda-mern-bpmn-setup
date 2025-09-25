import React, { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { exportToExcel, exportToCSV, exportToPDF, importFromExcel } from '../../utils/importExport';
import { Search, Printer, Download, Upload, X } from 'lucide-react';
import { ChartEditor } from '../Charts/ChartEditor';
import { DataValidationDialog } from './DataValidationDialog';
import { FilterDialog } from './FilterDialog';
import { ConditionalFormattingDialog } from './ConditionalFormattingDialog';

export const MenuBar: React.FC = () => {
  const { 
    sheets, 
    activeSheet, 
    undo, 
    redo, 
    undoStack, 
    redoStack,
    zoom,
    setZoom,
    showGridlines,
    toggleGridlines,
    showFormulaBar,
    toggleFormulaBar,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    performSearch,
    searchResults,
    setSelection,
    selection,
    updateCell,
    updateCellRange,
    pushToUndoStack,
    insertRow,
    insertColumn,
    deleteRow,
    deleteColumn,
    sortData,
    removeDuplicates,
    trimWhitespace
  } = useSpreadsheetStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showChartEditor, setShowChartEditor] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showDataValidationDialog, setShowDataValidationDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showConditionalFormattingDialog, setShowConditionalFormattingDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [commentText, setCommentText] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleInsertRowAbove = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { y } = selection.current.range;
    pushToUndoStack();
    insertRow(y);
    setActiveMenu(null);
  };

  const handleInsertRowBelow = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { y } = selection.current.range;
    pushToUndoStack();
    insertRow(y + 1);
    setActiveMenu(null);
  };

  const handleInsertColumnLeft = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { x } = selection.current.range;
    pushToUndoStack();
    insertColumn(x);
    setActiveMenu(null);
  };

  const handleInsertColumnRight = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { x } = selection.current.range;
    pushToUndoStack();
    insertColumn(x + 1);
    setActiveMenu(null);
  };

  const handleDeleteRow = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { y } = selection.current.range;
    pushToUndoStack();
    deleteRow(y);
    setActiveMenu(null);
  };

  const handleDeleteColumn = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { x } = selection.current.range;
    pushToUndoStack();
    deleteColumn(x);
    setActiveMenu(null);
  };

  const handleInsertLink = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    setShowLinkDialog(true);
    setActiveMenu(null);
  };

  const handleInsertComment = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    setShowCommentDialog(true);
    setActiveMenu(null);
  };

  const handleInsertCheckbox = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        updateCell(row, col, { checkbox: true, checkboxValue: false, value: '' });
      }
    }
    setActiveMenu(null);
  };

  const handleInsertImage = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl) {
      const { x, y } = selection.current.range;
      pushToUndoStack();
      updateCell(y, x, { image: imageUrl });
    }
    setActiveMenu(null);
  };

  const handleMergeCells = () => {
    if (!selection?.current?.range) {
      alert('Please select a range of cells first');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    if (width === 1 && height === 1) {
      alert('Please select more than one cell to merge');
      return;
    }
    
    pushToUndoStack();
    // Get the value from the top-left cell
    const topLeftCell = sheets[activeSheet][y][x];
    const mergedValue = topLeftCell?.value || '';
    
    // Clear all cells except top-left and set merge info
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        if (row === y && col === x) {
          updateCell(row, col, { 
            merged: true, 
            mergeRange: { startRow: y, endRow: y + height - 1, startCol: x, endCol: x + width - 1 },
            value: mergedValue
          });
        } else {
          updateCell(row, col, { value: '', merged: false });
        }
      }
    }
    setActiveMenu(null);
  };

  const handleWrapText = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    updateCellRange(y, x, y + height - 1, x + width - 1, { wrapText: true });
    setActiveMenu(null);
  };

  const handleTextRotation = () => {
    if (!selection?.current?.range) {
      alert('Please select a cell first');
      return;
    }
    const rotation = prompt('Enter rotation angle (0-360):');
    if (rotation && !isNaN(Number(rotation))) {
      const { x, y, width, height } = selection.current.range;
      pushToUndoStack();
      updateCellRange(y, x, y + height - 1, x + width - 1, { textRotation: Number(rotation) });
    }
    setActiveMenu(null);
  };

  const handleSort = (ascending: boolean) => {
    if (!selection?.current?.range) {
      alert('Please select a range to sort');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    sortData(y, x, y + height - 1, x + width - 1, ascending);
    setActiveMenu(null);
  };

  const handleRemoveDuplicates = () => {
    if (!selection?.current?.range) {
      alert('Please select a range first');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    removeDuplicates(y, x, y + height - 1, x + width - 1);
    setActiveMenu(null);
  };

  const handleTrimWhitespace = () => {
    if (!selection?.current?.range) {
      alert('Please select a range first');
      return;
    }
    const { x, y, width, height } = selection.current.range;
    pushToUndoStack();
    trimWhitespace(y, x, y + height - 1, x + width - 1);
    setActiveMenu(null);
  };

  const applyLink = () => {
    if (!selection?.current?.range || !linkUrl.trim()) return;
    
    const { x, y } = selection.current.range;
    pushToUndoStack();
    updateCell(y, x, { link: linkUrl.trim() });
    setLinkUrl('');
    setShowLinkDialog(false);
  };

  const applyComment = () => {
    if (!selection?.current?.range || !commentText.trim()) return;
    
    const { x, y } = selection.current.range;
    pushToUndoStack();
    updateCell(y, x, { comment: commentText.trim() });
    setCommentText('');
    setShowCommentDialog(false);
  };

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New', action: () => console.log('New') },
        { label: 'Open', action: () => console.log('Open') },
        { type: 'separator' },
        { 
          label: 'Import', 
          submenu: [
            { label: 'CSV', action: () => document.getElementById('csv-import')?.click() },
            { label: 'Excel (.xlsx)', action: () => document.getElementById('excel-import')?.click() },
            { label: 'JSON', action: () => document.getElementById('json-import')?.click() }
          ]
        },
        { 
          label: 'Export', 
          submenu: [
            { label: 'CSV', action: () => exportToCSV(sheets, activeSheet, 'spreadsheet') },
            { label: 'Excel (.xlsx)', action: () => exportToExcel(sheets, activeSheet, 'spreadsheet') },
            { label: 'PDF', action: () => exportToPDF(sheets, activeSheet, 'spreadsheet') }
          ]
        },
        { type: 'separator' },
        { label: 'Print', action: () => window.print() },
        { label: 'Download', action: () => exportToExcel(sheets, activeSheet, 'spreadsheet') }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: undo, disabled: undoStack.length === 0 },
        { label: 'Redo', action: redo, disabled: redoStack.length === 0 },
        { type: 'separator' },
        { label: 'Cut', action: () => console.log('Cut') },
        { label: 'Copy', action: () => console.log('Copy') },
        { label: 'Paste', action: () => console.log('Paste') },
        { label: 'Clear', action: () => console.log('Clear') },
        { type: 'separator' },
        { label: 'Find and Replace', action: () => console.log('Find and Replace') }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Gridlines', action: toggleGridlines, checked: showGridlines },
        { label: 'Formula bar', action: toggleFormulaBar, checked: showFormulaBar },
        { label: 'Dark theme', action: toggleTheme, checked: theme === 'dark' },
        { type: 'separator' },
        { 
          label: 'Zoom', 
          submenu: [
            { label: '25%', action: () => setZoom(25) },
            { label: '50%', action: () => setZoom(50) },
            { label: '75%', action: () => setZoom(75) },
            { label: '100%', action: () => setZoom(100) },
            { label: '125%', action: () => setZoom(125) },
            { label: '150%', action: () => setZoom(150) },
            { label: '200%', action: () => setZoom(200) }
          ]
        }
      ]
    },
    {
      label: 'Insert',
      items: [
        { label: 'Row above', action: handleInsertRowAbove },
        { label: 'Row below', action: handleInsertRowBelow },
        { label: 'Column left', action: handleInsertColumnLeft },
        { label: 'Column right', action: handleInsertColumnRight },
        { type: 'separator' },
        { label: 'Chart', action: () => setShowChartEditor(true) },
        { label: 'Image', action: handleInsertImage },
        { label: 'Link', action: handleInsertLink },
        { label: 'Comment', action: handleInsertComment },
        { label: 'Function', action: () => console.log('Function') },
        { label: 'Checkbox', action: handleInsertCheckbox },
        { type: 'separator' },
        { label: 'Drawing', action: () => console.log('Drawing') },
        { label: 'Table', action: () => console.log('Table') },
        { label: 'Pivot table', action: () => console.log('Pivot table') },
        { label: 'Slicer', action: () => console.log('Slicer') }
      ]
    },
    {
      label: 'Format',
      items: [
        { label: 'Bold', action: () => console.log('Bold') },
        { label: 'Italic', action: () => console.log('Italic') },
        { label: 'Strikethrough', action: () => console.log('Strikethrough') },
        { type: 'separator' },
        { label: 'Text color', action: () => console.log('Text color') },
        { label: 'Background color', action: () => console.log('Background color') },
        { label: 'Borders', action: () => console.log('Borders') },
        { type: 'separator' },
        { label: 'Merge cells', action: handleMergeCells },
        { label: 'Wrap text', action: handleWrapText },
        { label: 'Text rotation', action: handleTextRotation },
        { type: 'separator' },
        { label: 'Number format', action: () => console.log('Number format') },
        { label: 'Conditional formatting', action: () => setShowConditionalFormattingDialog(true) }
      ]
    },
    {
      label: 'Data',
      items: [
        { label: 'Sort A–Z', action: () => handleSort(true) },
        { label: 'Sort Z–A', action: () => handleSort(false) },
        { label: 'Filter', action: () => setShowFilterDialog(true) },
        { label: 'Data validation', action: () => setShowDataValidationDialog(true) },
        { type: 'separator' },
        { label: 'Pivot table', action: () => console.log('Pivot table') },
        { label: 'Split text to columns', action: () => console.log('Split text') },
        { label: 'Remove duplicates', action: handleRemoveDuplicates },
        { label: 'Trim whitespace', action: handleTrimWhitespace }
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Function helper', action: () => console.log('Function helper') },
        { label: 'Script editor', action: () => console.log('Script editor') },
        { label: 'Enable formulas', action: () => console.log('Enable formulas') },
        { type: 'separator' },
        { label: 'Spelling', action: () => console.log('Spelling') },
        { label: 'Accessibility', action: () => console.log('Accessibility') },
        { label: 'Notification rules', action: () => console.log('Notification rules') }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Shortcut guide', action: () => console.log('Shortcut guide') },
        { label: 'Documentation', action: () => console.log('Documentation') },
        { label: 'Report a problem', action: () => console.log('Report problem') },
        { label: 'Updates', action: () => console.log('Updates') }
      ]
    }
  ];

  const renderMenuItem = (item: any, index: number) => {
    if (item.type === 'separator') {
      return <div key={index} className={`border-t my-1 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`} />;
    }

    return (
      <div
        key={index}
        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
          item.disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'}`}
        onClick={() => {
          if (!item.disabled && item.action) {
            item.action();
            setActiveMenu(null);
          }
        }}
      >
        <span>{item.label}</span>
        {item.checked && <span className="text-blue-600">✓</span>}
        {item.submenu && <span className="text-gray-400">▶</span>}
      </div>
    );
  };

  return (
    <div className={`border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Top section with logo, title, and actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sheets
            </span>
          </div>
          
          <input
            type="text"
            placeholder="Untitled spreadsheet"
            className={`px-3 py-1 border rounded text-sm ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-10 pr-4 py-1 border rounded text-sm w-64 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {searchResults.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 border rounded shadow-lg z-50 max-h-40 overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
              }`}>
                {searchResults.slice(0, 10).map((result, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelection({
                        columns: CompactSelection.empty(),
                        rows: CompactSelection.empty(),
                        current: {
                          cell: [result.col, result.row],
                          range: { x: result.col, y: result.row, width: 1, height: 1 },
                          rangeStack: []
                        }
                      });
                      setSearchQuery('');
                    }}
                  >
                    {String.fromCharCode(65 + result.col)}{result.row + 1}: {sheets[activeSheet][result.row]?.[result.col]?.value || '(empty)'}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button className={`px-3 py-1 text-sm rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700'
          }`}>
            Share
          </button>
          
          <button className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>

      {/* Menu bar */}
      <div className={`flex items-center px-4 py-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        {menuItems.map((menu, index) => (
          <div key={index} className="relative">
            <button
              className={`px-3 py-1 text-sm rounded hover:bg-gray-200 ${
                theme === 'dark' ? 'text-white hover:bg-gray-600' : 'text-gray-700'
              } ${activeMenu === menu.label ? 'bg-gray-200' : ''}`}
              onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
            >
              {menu.label}
            </button>
            
            {activeMenu === menu.label && (
              <div className={`absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-50 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}>
                <div className="py-1">
                  {menu.items.map((item, itemIndex) => renderMenuItem(item, itemIndex))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input
        id="csv-import"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle CSV import
          console.log('CSV import', e.target.files);
        }}
      />
      <input
        id="excel-import"
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle Excel import
          console.log('Excel import', e.target.files);
        }}
      />
      <input
        id="json-import"
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle JSON import
          console.log('JSON import', e.target.files);
        }}
      />

      {/* Chart Editor */}
      <ChartEditor isOpen={showChartEditor} onClose={() => setShowChartEditor(false)} />

      {/* Data Validation Dialog */}
      <DataValidationDialog 
        isOpen={showDataValidationDialog} 
        onClose={() => setShowDataValidationDialog(false)} 
      />

      {/* Filter Dialog */}
      <FilterDialog 
        isOpen={showFilterDialog} 
        onClose={() => setShowFilterDialog(false)} 
      />

      {/* Conditional Formatting Dialog */}
      <ConditionalFormattingDialog 
        isOpen={showConditionalFormattingDialog} 
        onClose={() => setShowConditionalFormattingDialog(false)} 
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-96 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <button
                onClick={() => setShowLinkDialog(false)}
                className={`text-gray-500 hover:text-gray-700 ${
                  theme === 'dark' ? 'hover:text-gray-300' : ''
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              className={`w-full p-2 border rounded mb-4 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className={`px-4 py-2 border rounded hover:bg-gray-50 ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-white hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Dialog */}
      {showCommentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-96 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Comment</h3>
              <button
                onClick={() => setShowCommentDialog(false)}
                className={`text-gray-500 hover:text-gray-700 ${
                  theme === 'dark' ? 'hover:text-gray-300' : ''
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter comment"
              rows={4}
              className={`w-full p-2 border rounded mb-4 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCommentDialog(false)}
                className={`px-4 py-2 border rounded hover:bg-gray-50 ${
                  theme === 'dark' 
                    ? 'border-gray-600 text-white hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={applyComment}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};