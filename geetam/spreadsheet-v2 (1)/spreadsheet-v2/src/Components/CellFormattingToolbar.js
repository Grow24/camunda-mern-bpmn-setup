// Components/CellFormattingToolbar.js
import React, { useState, useRef, useEffect } from 'react';

const ColorPicker = ({ color, onChange, label, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const themeColors = [
    '#000000', '#FFFFFF', '#1E40AF', '#DC2626', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#FCD34D', '#34D399',
    '#4B5563', '#F3F4F6', '#BFDBFE', '#FCA5A5', '#FDE68A', '#A7F3D0', '#6B7280', '#E5E7EB', '#93C5FD', '#F87171',
    '#FCD34D', '#6EE7B7', '#D1D5DB', '#9CA3AF', '#60A5FA', '#EF4444', '#FBBF24', '#059669', '#4F46E5', '#B91C1C',
  ];

  const standardColors = [
    '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#800080', '#008080', '#FFC0CB', '#A52A2A', '#000080', '#808080', '#C0C0C0'
  ];

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => !disabled && setShowPicker(prev => !prev)}
        className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 ${
          disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'hover:bg-gray-300 active:bg-gray-400'
        }`}
        title={label}
        disabled={disabled}
      >
        <div className="w-5 h-5 rounded-sm border border-gray-400" style={{ backgroundColor: color }}></div>
        <span className="w-4 h-4 ml-1">▼</span>
      </button>
      {showPicker && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-50 min-w-[200px]">
          <div className="mb-2">
            <button
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center"
              onClick={() => { onChange('#000000'); setShowPicker(false); }}
            >
              <div className="w-4 h-4 rounded-sm border border-gray-400 mr-2" style={{ backgroundColor: '#000000' }}></div>
              Automatic
            </button>
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1 px-2">Theme Colors</p>
            <div className="grid grid-cols-5 gap-1">
              {themeColors.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-sm border border-gray-300 hover:scale-110 transition-transform duration-100 relative"
                  style={{ backgroundColor: c }}
                  onClick={() => { onChange(c); setShowPicker(false); }}
                  title={c}
                >
                  {color === c && <span className="absolute inset-0 flex items-center justify-center text-white" style={{ filter: 'drop-shadow(0 0 1px black)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1 px-2">Standard Colors</p>
            <div className="grid grid-cols-5 gap-1">
              {standardColors.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-sm border border-gray-300 hover:scale-110 transition-transform duration-100 relative"
                  style={{ backgroundColor: c }}
                  onClick={() => { onChange(c); setShowPicker(false); }}
                  title={c}
                >
                  {color === c && <span className="absolute inset-0 flex items-center justify-center text-white" style={{ filter: 'drop-shadow(0 0 1px black)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 cursor-pointer rounded-md overflow-hidden border border-gray-300 mt-2"
            title="More Colors..."
          />
        </div>
      )}
    </div>
  );
};

const generateFontFamilies = () => {
  // Common font families similar to Excel's default options
  return [
    "Arial", "Calibri", "Times New Roman", "Verdana", "Tahoma", "Georgia",
    "Courier New", "Lucida Console", "Impact", "Comic Sans MS", "Garamond",
    "Trebuchet MS", "Palatino Linotype", "Book Antiqua", "Franklin Gothic Medium",
    "Century Gothic", "Gill Sans MT", "Consolas", "Cambria", "Candara",
    "Segoe UI", "Open Sans", "Roboto", "Lato", "Montserrat"
  ];
};

const FONT_FAMILIES = generateFontFamilies();
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];


const CellFormattingToolbar = ({ onApplyFormat, readOnlyMode, initialStyles = {} }) => {
  const [isBold, setIsBold] = useState(initialStyles.fontWeight === 'bold');
  const [isItalic, setIsItalic] = useState(initialStyles.fontStyle === 'italic');
  const [isUnderline, setIsUnderline] = useState(initialStyles.textDecoration?.includes('underline'));
  const [isStrikethrough, setIsStrikethrough] = useState(initialStyles.textDecoration?.includes('line-through'));
  const [textColor, setTextColor] = useState(initialStyles.color || '#000000');
  const [backgroundColor, setBackgroundColor] = useState(initialStyles.backgroundColor || '#FFFFFF');
  const [borderColor, setBorderColor] = useState(initialStyles.borderColor || '#E2E8F0');
  const [fontSize, setFontSize] = useState(initialStyles.fontSize || 11); // Default font size
  const [fontFamily, setFontFamily] = useState(initialStyles.fontFamily || 'Arial'); // Default font family
  const [textAlign, setTextAlign] = useState(initialStyles.textAlign || 'left'); // Default text alignment


  // Update local state when initialStyles prop changes (e.g., when active cell changes)
  useEffect(() => {
    setIsBold(initialStyles.fontWeight === 'bold');
    setIsItalic(initialStyles.fontStyle === 'italic');
    setIsUnderline(initialStyles.textDecoration?.includes('underline'));
    setIsStrikethrough(initialStyles.textDecoration?.includes('line-through'));
    setTextColor(initialStyles.color || '#000000');
    setBackgroundColor(initialStyles.backgroundColor || '#FFFFFF');
    setBorderColor(initialStyles.borderColor || '#E2E8F0');
    const sizeStr = initialStyles.fontSize || '11px';
const numericSize = parseInt(sizeStr, 10);
setFontSize(Number.isNaN(numericSize) ? 11 : numericSize);

    setFontFamily(initialStyles.fontFamily || 'Arial');
    setTextAlign(initialStyles.textAlign || 'left');
  }, [initialStyles]);


  const toggleBold = () => {
    if (readOnlyMode) return;
    const newBold = !isBold;
    setIsBold(newBold);
    onApplyFormat({ fontWeight: newBold ? 'bold' : 'normal' });
  };

  const toggleItalic = () => {
    if (readOnlyMode) return;
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    onApplyFormat({ fontStyle: newItalic ? 'italic' : 'normal' });
  };

  const toggleUnderline = () => {
  if (readOnlyMode) return;
  const newUnderline = !isUnderline;
  const newStrikethrough = isStrikethrough; // keep current strikethrough state
  setIsUnderline(newUnderline);

  const newTextDecoration = [];
  if (newUnderline) newTextDecoration.push('underline');
  if (newStrikethrough) newTextDecoration.push('line-through');

  onApplyFormat({ textDecoration: newTextDecoration.join(' ') || 'none' });
};


  const toggleStrikethrough = () => {
  if (readOnlyMode) return;
  const newStrikethrough = !isStrikethrough;
  const newUnderline = isUnderline; // keep current underline state
  setIsStrikethrough(newStrikethrough);

  const newTextDecoration = [];
  if (newUnderline) newTextDecoration.push('underline');
  if (newStrikethrough) newTextDecoration.push('line-through');

  onApplyFormat({ textDecoration: newTextDecoration.join(' ') || 'none' });
};


  const handleTextColorChange = (color) => {
    if (readOnlyMode) return;
    setTextColor(color);
    onApplyFormat({ color: color });
  };

  const handleBackgroundColorChange = (color) => {
    if (readOnlyMode) return;
    setBackgroundColor(color);
    onApplyFormat({ backgroundColor: color });
  };

  const handleBorderColorChange = (color) => {
    if (readOnlyMode) return;
    setBorderColor(color);
    onApplyFormat({ borderColor: color });
  };

  const handleFontSizeChange = (e) => {
    if (readOnlyMode) return;
    const newSize = parseInt(e.target.value, 10);
    setFontSize(newSize);
    onApplyFormat({ fontSize: `${newSize}px` }); // Ensure 'px' unit for CSS
  };

  const handleFontFamilyChange = (e) => {
    if (readOnlyMode) return;
    const newFamily = e.target.value;
    setFontFamily(newFamily);
    onApplyFormat({ fontFamily: newFamily });
  };

  const handleTextAlignChange = (alignment) => {
    if (readOnlyMode) return;
    setTextAlign(alignment);
    onApplyFormat({ textAlign: alignment });
  };

  const buttonClass = (isActive) => `
    p-2 rounded-md transition-colors duration-200
    ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
    ${readOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className="flex items-center space-x-2 bg-gray-200 px-4 py-2 border-l border-gray-300">
      {/* Font Family */}
      <select
        value={fontFamily}
        onChange={handleFontFamilyChange}
        disabled={readOnlyMode}
        className={`px-2 py-1 rounded-md border border-gray-300 text-sm ${readOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Font Family"
        style={{ fontFamily: fontFamily }} // Apply selected font to the dropdown itself
      >
        {FONT_FAMILIES.map(family => (
          <option key={family} value={family} style={{ fontFamily: family }}>
            {family}
          </option>
        ))}
      </select>

      {/* Font Size */}
      <select
        value={fontSize}
        onChange={handleFontSizeChange}
        disabled={readOnlyMode}
        className={`px-2 py-1 rounded-md border border-gray-300 text-sm ${readOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Font Size"
      >
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      {/* Font Styles */}
      <button
        onClick={toggleBold}
        className={buttonClass(isBold)}
        title="Bold"
        disabled={readOnlyMode}
      >
        <span className="font-bold text-lg">B</span>
      </button>
      <button
        onClick={toggleItalic}
        className={buttonClass(isItalic)}
        title="Italic"
        disabled={readOnlyMode}
      >
        <span className="italic text-lg">I</span>
      </button>
      <button
        onClick={toggleUnderline}
        className={buttonClass(isUnderline)}
        title="Underline"
        disabled={readOnlyMode}
      >
        <span className="underline text-lg">U</span>
      </button>
      <button
        onClick={toggleStrikethrough}
        className={buttonClass(isStrikethrough)}
        title="Strikethrough"
        disabled={readOnlyMode}
      >
        <span className="line-through text-lg">S</span>
      </button>

      {/* Alignment */}
      <button
        onClick={() => handleTextAlignChange('left')}
        className={buttonClass(textAlign === 'left')}
        title="Align Left"
        disabled={readOnlyMode}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="15" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <button
        onClick={() => handleTextAlignChange('center')}
        className={buttonClass(textAlign === 'center')}
        title="Align Center"
        disabled={readOnlyMode}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="7" y1="12" x2="17" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <button
        onClick={() => handleTextAlignChange('right')}
        className={buttonClass(textAlign === 'right')}
        title="Align Right"
        disabled={readOnlyMode}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="9" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Color Pickers */}
      <ColorPicker
        color={textColor}
        onChange={handleTextColorChange}
        label="Text Color"
        disabled={readOnlyMode}
      />
      <ColorPicker
        color={backgroundColor}
        onChange={handleBackgroundColorChange}
        label="Background Color"
        disabled={readOnlyMode}
      />
      <ColorPicker
        color={borderColor}
        onChange={handleBorderColorChange}
        label="Border Color"
        disabled={readOnlyMode}
      />
    </div>
  );
};

export default CellFormattingToolbar;
