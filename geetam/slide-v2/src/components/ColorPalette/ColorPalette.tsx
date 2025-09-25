import React from 'react';
import { Palette, Paintbrush, Droplet, Square, BadgeCent as Gradient } from 'lucide-react';
import useSlideStore from '../../store/slideStore';

const ColorPalette: React.FC = () => {
  const { 
    slides, 
    currentSlideId, 
    isDarkMode, 
    updateSlideTheme, 
    predefinedThemes, 
    setCurrentTheme 
  } = useSlideStore();
  
  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  // Fallback theme to prevent undefined errors
  const fallbackTheme = {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#3b82f6',
    borderColor: '#e5e7eb',
    useGradient: false,
    gradientFrom: '#ffffff',
    gradientTo: '#ffffff'
  };

  // Use fallback theme if currentSlide.theme is undefined
  const slideTheme = currentSlide?.theme || fallbackTheme;

  const handleColorChange = (property: string, value: string) => {
    if (currentSlideId) {
      updateSlideTheme(currentSlideId, { [property]: value });
    }
  };

  const handleGradientToggle = () => {
    if (currentSlideId) {
      updateSlideTheme(currentSlideId, { 
        useGradient: !slideTheme.useGradient 
      });
    }
  };

  const applyTheme = (theme: any) => {
    if (currentSlideId) {
      updateSlideTheme(currentSlideId, theme.slideDefaults);
    }
    setCurrentTheme(theme);
  };

  if (!currentSlide) {
    return (
      <div className={`h-full flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a slide to customize colors</p>
        </div>
      </div>
    );
  }

  const ColorInput: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    icon: React.ReactNode;
  }> = ({ label, value, onChange, icon }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {icon}
        <label className={`text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 px-2 py-1 text-xs rounded border font-mono ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600 text-gray-300'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
        />
      </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-inherit">
        <div className="flex items-center space-x-2">
          <Palette className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Color Palette
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Predefined Themes */}
        <div>
          <h3 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Themes
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {predefinedThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => applyTheme(theme)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ 
                      background: theme.slideDefaults.useGradient && theme.slideDefaults.gradientFrom
                        ? `linear-gradient(135deg, ${theme.slideDefaults.gradientFrom}, ${theme.slideDefaults.gradientTo})`
                        : theme.slideDefaults.backgroundColor
                    }}
                  />
                  <div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {theme.name}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {theme.slideDefaults.useGradient ? 'Gradient' : 'Solid'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div>
          <h3 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Custom Colors
          </h3>
          <div className="space-y-4">
            <ColorInput
              label="Background"
              value={slideTheme.backgroundColor}
              onChange={(value) => handleColorChange('backgroundColor', value)}
              icon={<Square className="w-4 h-4 text-blue-500" />}
            />

            <ColorInput
              label="Text"
              value={slideTheme.textColor}
              onChange={(value) => handleColorChange('textColor', value)}
              icon={<Paintbrush className="w-4 h-4 text-green-500" />}
            />

            <ColorInput
              label="Accent"
              value={slideTheme.accentColor}
              onChange={(value) => handleColorChange('accentColor', value)}
              icon={<Droplet className="w-4 h-4 text-purple-500" />}
            />

            <ColorInput
              label="Border"
              value={slideTheme.borderColor}
              onChange={(value) => handleColorChange('borderColor', value)}
              icon={<Square className="w-4 h-4 text-gray-500" />}
            />
          </div>
        </div>

        {/* Gradient Options */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Gradient Background
            </h3>
            <button
              onClick={handleGradientToggle}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                slideTheme.useGradient
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {slideTheme.useGradient ? 'ON' : 'OFF'}
            </button>
          </div>

          {slideTheme.useGradient && (
            <div className="space-y-4">
              <ColorInput
                label="Gradient From"
                value={slideTheme.gradientFrom || slideTheme.backgroundColor}
                onChange={(value) => handleColorChange('gradientFrom', value)}
                icon={<Gradient className="w-4 h-4 text-pink-500" />}
              />

              <ColorInput
                label="Gradient To"
                value={slideTheme.gradientTo || slideTheme.backgroundColor}
                onChange={(value) => handleColorChange('gradientTo', value)}
                icon={<Gradient className="w-4 h-4 text-orange-500" />}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <h3 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Preview
          </h3>
          <div 
            className="w-full h-20 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all duration-300"
            style={{
              background: slideTheme.useGradient && slideTheme.gradientFrom
                ? `linear-gradient(135deg, ${slideTheme.gradientFrom}, ${slideTheme.gradientTo})`
                : slideTheme.backgroundColor,
              color: slideTheme.textColor,
              borderColor: slideTheme.borderColor,
            }}
          >
            <span style={{ color: slideTheme.accentColor }}>
              Sample Text
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;