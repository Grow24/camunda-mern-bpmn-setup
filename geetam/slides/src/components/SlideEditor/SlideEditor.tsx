import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import Editor from '@monaco-editor/react';
import { Code, FileText } from 'lucide-react';
import useSlideStore from '../../store/slideStore';

const SlideEditor: React.FC = () => {
  const { slides, currentSlideId, isDarkMode, updateSlide, toggleContentMode } = useSlideStore();
  
  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  const handleContentChange = (value: string | undefined) => {
    if (currentSlideId && value !== undefined) {
      updateSlide(currentSlideId, { content: value });
    }
  };

  const handleToggleMode = () => {
    if (currentSlideId) {
      toggleContentMode(currentSlideId);
    }
  };

  if (!currentSlide) {
    return (
      <div className={`h-full flex items-center justify-center border-r transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Select a slide to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col border-r transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-inherit">
        <div>
          <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentSlide.title}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last updated: {currentSlide.updatedAt.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            currentSlide.contentMode === 'html'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {currentSlide.contentMode?.toUpperCase() || 'MARKDOWN'}
          </span>
          
          <button
            onClick={handleToggleMode}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }`}
            title={`Switch to ${currentSlide.contentMode === 'markdown' ? 'HTML' : 'Markdown'} mode (Ctrl+E)`}
          >
            {currentSlide.contentMode === 'html' ? 
              <FileText className="w-4 h-4" /> : 
              <Code className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentSlide.contentMode === 'markdown' ? (
          <MDEditor
            value={currentSlide.content}
            onChange={handleContentChange}
            preview="edit"
            hideToolbar={false}
            visibleDragBar={false}
            textareaProps={{
              placeholder: 'Start writing your slide content in Markdown...',
              style: {
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
              },
            }}
            height="100%"
            data-color-mode={isDarkMode ? 'dark' : 'light'}
          />
        ) : (
          <div className="h-full">
            <Editor
              value={currentSlide.content}
              onChange={handleContentChange}
              language="html"
              theme={isDarkMode ? 'vs-dark' : 'vs-light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideEditor;