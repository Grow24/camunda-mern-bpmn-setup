import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Copy, Trash2, GripVertical } from 'lucide-react';
import useSlideStore from '../../store/slideStore';
import { Slide } from '../../types/slide';

const SlideItem: React.FC<{
  slide: Slide;
  index: number;
  isActive: boolean;
  isDarkMode: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}> = ({ slide, index, isActive, isDarkMode, onSelect, onDuplicate, onDelete }) => {
  return (
    <Draggable draggableId={slide.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative border rounded-lg transition-all duration-200 ${
            isActive
              ? isDarkMode
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-blue-500 bg-blue-50'
              : isDarkMode
              ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${snapshot.isDragging ? 'shadow-xl' : 'shadow-sm hover:shadow-md'}`}
        >
          <div className="flex items-start p-3 cursor-pointer" onClick={onSelect}>
            <div
              {...provided.dragHandleProps}
              className={`mr-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Slide {index + 1}
              </div>
              <h3 className={`font-medium text-sm truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {slide.title}
              </h3>
              <div className={`text-xs mt-1 line-clamp-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {slide.content.replace(/^#+ /, '').split('\n').slice(1).join(' ').trim().substring(0, 60)}...
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className={`p-1 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Duplicate slide"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`p-1 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-red-900 text-red-400'
                  : 'hover:bg-red-100 text-red-600'
              }`}
              title="Delete slide"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const SlideList: React.FC = () => {
  const {
    slides,
    currentSlideId,
    isDarkMode,
    addSlide,
    duplicateSlide,
    deleteSlide,
    setCurrentSlide,
    reorderSlides,
  } = useSlideStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderSlides(result.source.index, result.destination.index);
  };

  React.useEffect(() => {
    if (!currentSlideId && slides.length > 0) {
      setCurrentSlide(slides[0].id);
    }
  }, [slides, currentSlideId, setCurrentSlide]);

  return (
    <div className={`h-full flex flex-col border-r transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-inherit">
        <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Slides ({slides.length})
        </h2>
        <button
          onClick={addSlide}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Add new slide"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {slides.map((slide, index) => (
                  <SlideItem
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isActive={slide.id === currentSlideId}
                    isDarkMode={isDarkMode}
                    onSelect={() => setCurrentSlide(slide.id)}
                    onDuplicate={() => duplicateSlide(slide.id)}
                    onDelete={() => deleteSlide(slide.id)}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default SlideList;