import { useEffect } from 'react';
import useSlideStore from '../store/slideStore';

const useKeyboardShortcuts = () => {
  const { 
    undo, 
    redo, 
    addSlide, 
    canUndo, 
    canRedo, 
    toggleContentMode, 
    toggleColorPalette,
    currentSlideId 
  } = useSlideStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input or textarea
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.contentEditable === 'true';

      // Global shortcuts (work everywhere)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              // Ctrl+Shift+Z or Cmd+Shift+Z for redo
              event.preventDefault();
              if (canRedo()) redo();
            } else {
              // Ctrl+Z or Cmd+Z for undo
              event.preventDefault();
              if (canUndo()) undo();
            }
            break;
          case 'y':
            // Ctrl+Y or Cmd+Y for redo
            event.preventDefault();
            if (canRedo()) redo();
            break;
          case 's':
            // Ctrl+S or Cmd+S for save
            event.preventDefault();
            // Auto-save is handled by zustand persist
            break;
          case 'e':
            // Ctrl+E or Cmd+E for toggle content mode
            event.preventDefault();
            if (currentSlideId) {
              toggleContentMode(currentSlideId);
            }
            break;
          case 'b':
            // Ctrl+B or Cmd+B for toggle color palette
            event.preventDefault();
            toggleColorPalette();
            break;
        }
      }

      // Shortcuts that don't work when in input fields
      if (!isInInput) {
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'Enter':
              // Ctrl+Enter or Cmd+Enter for new slide
              event.preventDefault();
              addSlide();
              break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, addSlide, canUndo, canRedo, toggleContentMode, toggleColorPalette, currentSlideId]);
};

export default useKeyboardShortcuts;