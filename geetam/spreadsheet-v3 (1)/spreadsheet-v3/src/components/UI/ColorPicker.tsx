// import React, { useState } from 'react';

// interface ColorPickerProps {
//   value: string;
//   onChange: (color: string) => void;
//   label?: string;
// }

// const predefinedColors = [
//   '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
//   '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
//   '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
//   '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
//   '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
//   '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
//   '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
//   '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
// ];

// export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <div className="flex items-center gap-2">
//         {label && <span className="text-sm font-medium text-gray-700">{label}:</span>}
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="w-8 h-8 border border-gray-300 rounded cursor-pointer shadow-sm hover:shadow-md transition-shadow"
//           style={{ backgroundColor: value }}
//         />
//       </div>
      
//       {isOpen && (
//         <div className="absolute top-10 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
//           <div className="grid grid-cols-10 gap-1 mb-3">
//             {predefinedColors.map((color) => (
//               <button
//                 key={color}
//                 onClick={() => {
//                   onChange(color);
//                   setIsOpen(false);
//                 }}
//                 className="w-6 h-6 border border-gray-200 rounded hover:scale-110 transition-transform"
//                 style={{ backgroundColor: color }}
//               />
//             ))}
//           </div>
//           <input
//             type="color"
//             value={value}
//             onChange={(e) => onChange(e.target.value)}
//             className="w-full h-8 border border-gray-300 rounded cursor-pointer"
//           />
//         </div>
//       )}
//     </div>
//   );
// };









































import React, { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const colorPalette = [
  ['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'],
  ['#ffe6e6', '#ffb3b3', '#ff6666', '#ff0000', '#cc0000', '#8b0000'],
  ['#ffe6cc', '#ffcc66', '#ffaa00', '#ff8800', '#ff6600', '#cc4400'],
  ['#fffbcc', '#fff799', '#ffee66', '#ffdd00', '#e6b800', '#b8860b'],
  ['#e6ffe6', '#b3ffb3', '#66ff66', '#00cc00', '#009900', '#006600'],
  ['#e6f2ff', '#b3ccff', '#6699ff', '#0066ff', '#0000cc', '#000080'],
  ['#e6d9ff', '#ccb3ff', '#aa66ff', '#8800ff', '#6600cc', '#4b0082'],
  ['#ffe6f7', '#ffccee', '#ff99dd', '#ff66cc', '#ff3399', '#cc0066'],
  ['#e6ffff', '#b3ffff', '#66ffff', '#00cccc', '#009999', '#006666']
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  const handleNoFill = () => {
    onChange('transparent');
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    onChange(color);
    // Add to custom colors if it's not already there
    if (!customColors.includes(color)) {
      setCustomColors(prev => [color, ...prev.slice(0, 9)]); // Keep only last 10 custom colors
    }
  };

  const renderColorPreview = (color: string) => {
    if (color === 'transparent') {
      return (
        <div className="w-full h-full bg-white relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-0.5 bg-red-500 transform rotate-45"></div>
          </div>
        </div>
      );
    }
    return <div className="w-full h-full" style={{ backgroundColor: color }}></div>;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {label && <span className="text-sm font-medium text-gray-700">{label}:</span>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-7 h-7 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-400 overflow-hidden"
          title={value === 'transparent' ? 'No Color' : `Color: ${value}`}
        >
          {renderColorPreview(value)}
        </button>
      </div>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4">
            {/* No Fill Option */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Fill Options</h3>
              <button
                onClick={handleNoFill}
                className="w-8 h-8 border-2 border-gray-300 rounded hover:border-gray-400 transition-colors relative bg-white mr-2"
                title="No fill"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-red-500 transform rotate-45"></div>
                </div>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Color Palette</h3>
              <div className="flex gap-1.5">
                {colorPalette.map((colorColumn, columnIndex) => (
                  <div key={columnIndex} className="flex flex-col gap-1">
                    {colorColumn.map((color, colorIndex) => (
                      <button
                        key={`${color}-${colorIndex}`}
                        onClick={() => {
                          onChange(color);
                          setIsOpen(false);
                        }}
                        className={`w-6 h-6 border rounded transition-all duration-150 hover:scale-110 hover:shadow-md ${
                          value === color ? 'border-2 border-blue-500 shadow-md' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Color Input */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Custom Color</h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  // value={value === 'transparent' ? '#000000' : value}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                {/* <span className='from-gray-100'>More Colors</span> */}
                {/* <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Enter hex color"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                /> */}
              </div>
            </div>

            {/* Quick Actions */}
            {/* <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Close
                </button>
                <div className="text-xs text-gray-500">
                  Current: {value === 'transparent' ? 'No fill' : value}
                </div>
              </div>
            </div> */}
          </div>
        </>
      )}
    </div>
  );
};