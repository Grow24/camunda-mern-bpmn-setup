import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { Type, Image, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import useSlideStore from '../../store/slideStore';
import 'react-resizable/css/styles.css';

const CanvasEditor: React.FC = () => {
  const {
    slides,
    currentSlideId,
    isDarkMode,
    canvasSize,
    selectedElementId,
    addElement,
    updateElement,
    deleteElement,
    setSelectedElement,
  } = useSlideStore();

  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  if (!currentSlide) {
    return (
      <div className={`h-full flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'
      }`}>
        <p>Select a slide to start editing</p>
      </div>
    );
  }

  const selectedElement = currentSlide.elements.find(el => el.id === selectedElementId);

  const handleAddTextBox = () => {
    if (!currentSlideId) return;

    addElement(currentSlideId, {
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      style: {
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'left',
        color: currentSlide.theme.textColor,
        zIndex: 1,
      },
      content: 'Double-click to edit text',
    });
  };

  const handleImageUpload = (file: File) => {
    if (!currentSlideId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      addElement(currentSlideId, {
        type: 'image',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        style: { zIndex: 1 },
        content: result,
        altText: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    setDraggedFile(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleElementDrag = (elementId: string, data: { x: number; y: number }) => {
    if (!currentSlideId) return;
    updateElement(currentSlideId, elementId, {
      position: { x: data.x, y: data.y },
    });
  };

  const handleElementResize = (elementId: string, size: { width: number; height: number }) => {
    if (!currentSlideId) return;
    updateElement(currentSlideId, elementId, { size });
  };

  const handleTextEdit = (elementId: string, content: string) => {
    if (!currentSlideId) return;
    updateElement(currentSlideId, elementId, { content });
  };

  const handleStyleUpdate = (property: string, value: any) => {
    if (!currentSlideId || !selectedElementId) return;
    updateElement(currentSlideId, selectedElementId, {
      style: { ...selectedElement?.style, [property]: value },
    });
  };

  const getSlideStyles = () => {
    const theme = currentSlide.theme;
    const baseStyles: React.CSSProperties = {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      borderColor: theme.borderColor,
    };

    if (theme.useGradient && theme.gradientFrom && theme.gradientTo) {
      baseStyles.background = `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`;
    }

    return baseStyles;
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddTextBox}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">Add Text</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span className="text-sm">Add Image</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {selectedElement && (
          <div className="flex items-center space-x-2">
            {selectedElement.type === 'text' && (
              <>
                <button
                  onClick={() => handleStyleUpdate('fontWeight', 
                    selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold'
                  )}
                  className={`p-2 rounded transition-colors ${
                    selectedElement.style.fontWeight === 'bold'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                      : isDarkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleStyleUpdate('fontStyle',
                    selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic'
                  )}
                  className={`p-2 rounded transition-colors ${
                    selectedElement.style.fontStyle === 'italic'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                      : isDarkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleStyleUpdate('textDecoration',
                    selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline'
                  )}
                  className={`p-2 rounded transition-colors ${
                    selectedElement.style.textDecoration === 'underline'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                      : isDarkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => handleStyleUpdate('textAlign', align)}
                    className={`p-2 rounded transition-colors ${
                      selectedElement.style.textAlign === align
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                        : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                  </button>
                ))}

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                <input
                  type="range"
                  min="8"
                  max="72"
                  value={selectedElement.style.fontSize || 16}
                  onChange={(e) => handleStyleUpdate('fontSize', parseInt(e.target.value))}
                  className="w-20"
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedElement.style.fontSize || 16}px
                </span>
              </>
            )}

            <button
              onClick={() => {
                if (currentSlideId && selectedElementId) {
                  deleteElement(currentSlideId, selectedElementId);
                }
              }}
              className="p-2 rounded transition-colors text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-center">
          <div
            className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-lg"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              ...getSlideStyles(),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => setSelectedElement(null)}
          >
            {currentSlide.elements.map((element) => (
              <Draggable
                key={element.id}
                position={element.position}
                onDrag={(_, data) => handleElementDrag(element.id, data)}
                bounds="parent"
              >
                <div
                  className={`absolute cursor-move ${
                    selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                  }}
                >
                  <ResizableBox
                    width={element.size.width}
                    height={element.size.height}
                    onResize={(_, { size }) => handleElementResize(element.id, size)}
                    minConstraints={[50, 20]}
                    maxConstraints={[canvasSize.width - element.position.x, canvasSize.height - element.position.y]}
                    resizeHandles={selectedElementId === element.id ? ['se'] : []}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        ...element.style,
                        zIndex: element.style.zIndex || 1,
                      }}
                    >
                      {element.type === 'text' ? (
                        <div
                          className="w-full h-full p-2 outline-none resize-none overflow-hidden"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleTextEdit(element.id, e.currentTarget.textContent || '')}
                          style={{
                            fontSize: element.style.fontSize,
                            fontWeight: element.style.fontWeight,
                            fontStyle: element.style.fontStyle,
                            textDecoration: element.style.textDecoration,
                            textAlign: element.style.textAlign,
                            color: element.style.color,
                            backgroundColor: element.style.backgroundColor,
                            borderRadius: element.style.borderRadius,
                          }}
                        >
                          {element.content}
                        </div>
                      ) : (
                        <img
                          src={element.content}
                          alt={element.altText || 'Slide image'}
                          className="w-full h-full object-cover"
                          style={{
                            borderRadius: element.style.borderRadius,
                          }}
                        />
                      )}
                    </div>
                  </ResizableBox>
                </div>
              </Draggable>
            ))}

            {currentSlide.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-lg mb-2">Canvas Mode</p>
                  <p className="text-sm">Add text boxes and images to create your slide</p>
                  <p className="text-xs mt-2">Drag and drop images or use the toolbar above</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;