import React from 'react';
import { Save, Download, Upload, Undo, Redo, Sun, Moon, Play, Edit3, Palette, Code, FileText, Layout, FileJson } from 'lucide-react';
import useSlideStore from '../../store/slideStore';
import { saveAs } from 'file-saver';

const Header: React.FC = () => {
  const {
    slides,
    currentSlideId,
    isDarkMode,
    isPreviewMode,
    showColorPalette,
    toggleDarkMode,
    togglePreviewMode,
    toggleColorPalette,
    toggleContentMode,
    exportSlides,
    exportToPowerPoint,
    exportToJSON,
    importSlides,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSlideStore();

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  const handleExport = () => {
    const content = exportSlides();
    const blob = new Blob([content], { type: 'text/markdown' });
    saveAs(blob, 'presentation.md');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importSlides(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    // Auto-save is handled by zustand persist; this is optional backup
    const slides = useSlideStore.getState().slides;
    localStorage.setItem('slide-editor-backup', JSON.stringify(slides));
  };

  const handleToggleContentMode = () => {
    if (currentSlideId) {
      toggleContentMode(currentSlideId);
    }
  };

  const getContentModeIcon = () => {
    if (!currentSlide) return <FileText className="w-4 h-4" />;
    
    switch (currentSlide.contentMode) {
      case 'html':
        return <Code className="w-4 h-4" />;
      case 'canvas':
        return <Layout className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getContentModeLabel = () => {
    if (!currentSlide) return 'Markdown';
    
    switch (currentSlide.contentMode) {
      case 'html':
        return 'HTML';
      case 'canvas':
        return 'Canvas';
      default:
        return 'Markdown';
    }
  };

  return (
    <header className={`border-b transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Edit3 className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Slide Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`p-2 rounded-lg transition-colors ${
              canUndo()
                ? isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`p-2 rounded-lg transition-colors ${
              canRedo()
                ? isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

          <button
            onClick={handleToggleContentMode}
            disabled={!currentSlide}
            className={`p-2 rounded-lg transition-colors ${
              currentSlide
                ? currentSlide.contentMode !== 'markdown'
                  ? isDarkMode
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-600'
                  : isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={`Switch to next mode (${getContentModeLabel()}) (Ctrl+E)`}
          >
            {getContentModeIcon()}
          </button>

          <button
            onClick={toggleColorPalette}
            className={`p-2 rounded-lg transition-colors ${
              showColorPalette
                ? isDarkMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-600'
                : isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Toggle Color Palette (Ctrl+B)"
          >
            <Palette className="w-4 h-4" />
          </button>

          <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

          <button
            onClick={handleSave}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Save Backup (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          <label className={`p-2 rounded-lg cursor-pointer transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
          }`} title="Import Markdown">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleExport}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title="Export Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={exportToPowerPoint}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Export to PowerPoint"
            >
              PPTX
            </button>

            <button
              onClick={exportToJSON}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title="Export to JSON"
            >
              <FileJson className="w-4 h-4" />
            </button>
          </div>

          <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

          <button
            onClick={togglePreviewMode}
            className={`p-2 rounded-lg transition-colors ${
              isPreviewMode
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-600'
                : isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Toggle Preview Mode"
          >
            <Play className="w-4 h-4" />
          </button>

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;