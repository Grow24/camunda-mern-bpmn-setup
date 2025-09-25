import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './components/Layout/Header';
import SlideList from './components/SlideList/SlideList';
import SlideEditor from './components/SlideEditor/SlideEditor';
import SlidePreview from './components/SlidePreview/SlidePreview';
import ColorPalette from './components/ColorPalette/ColorPalette';
import useSlideStore from './store/slideStore';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

function App() {
  const { isDarkMode, isPreviewMode, showColorPalette } = useSlideStore();
  
  useKeyboardShortcuts();

  useEffect(() => {
    // Apply dark mode to document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <Header />
      
      <div className="h-[calc(100vh-73px)]">
        <PanelGroup direction="horizontal">
          {/* Slide List Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <SlideList />
          </Panel>
          
          <PanelResizeHandle className={`w-1 transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`} />
          
          {!isPreviewMode ? (
            <>
              {/* Editor Panel */}
              <Panel defaultSize={showColorPalette ? 40 : 50} minSize={30}>
                <SlideEditor />
              </Panel>
              
              <PanelResizeHandle className={`w-1 transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`} />
              
              {/* Preview Panel */}
              <Panel defaultSize={showColorPalette ? 25 : 30} minSize={20}>
                <SlidePreview />
              </Panel>

              {showColorPalette && (
                <>
                  <PanelResizeHandle className={`w-1 transition-colors duration-200 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`} />
                  
                  {/* Color Palette Panel */}
                  <Panel defaultSize={15} minSize={12} maxSize={25}>
                    <ColorPalette />
                  </Panel>
                </>
              )}
            </>
          ) : (
            /* Full Preview Mode */
            <Panel>
              <SlidePreview />
            </Panel>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;