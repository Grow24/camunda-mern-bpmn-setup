import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { Slide, SlideStore, SlideTheme, AppTheme, SlideElement } from '../types/slide';
import PptxGenJS from 'pptxgenjs';
import { saveAs } from 'file-saver';

const defaultSlideTheme: SlideTheme = {
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#3b82f6',
  borderColor: '#e5e7eb',
  useGradient: false,
};

const defaultDarkSlideTheme: SlideTheme = {
  backgroundColor: '#1f2937',
  textColor: '#f9fafb',
  accentColor: '#60a5fa',
  borderColor: '#374151',
  useGradient: false,
};

const predefinedThemes: AppTheme[] = [
  { name: 'Default Light', fontFamily: 'Inter, system-ui, sans-serif', slideDefaults: defaultSlideTheme },
  { name: 'Default Dark', fontFamily: 'Inter, system-ui, sans-serif', slideDefaults: defaultDarkSlideTheme },
  {
    name: 'Ocean Blue',
    fontFamily: 'Inter, system-ui, sans-serif',
    slideDefaults: {
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      accentColor: '#0ea5e9',
      borderColor: '#334155',
      gradientFrom: '#0f172a',
      gradientTo: '#1e293b',
      useGradient: true,
    },
  },
  {
    name: 'Sunset',
    fontFamily: 'Inter, system-ui, sans-serif',
    slideDefaults: {
      backgroundColor: '#fef3c7',
      textColor: '#92400e',
      accentColor: '#f59e0b',
      borderColor: '#fbbf24',
      gradientFrom: '#fef3c7',
      gradientTo: '#fed7aa',
      useGradient: true,
    },
  },
  {
    name: 'Forest',
    fontFamily: 'Inter, system-ui, sans-serif',
    slideDefaults: {
      backgroundColor: '#064e3b',
      textColor: '#ecfdf5',
      accentColor: '#10b981',
      borderColor: '#047857',
      useGradient: false,
    },
  },
];

const createSlide = (
  title: string = 'Untitled Slide',
  content: string = '# Slide Title\n\nYour content here...',
  theme: SlideTheme = defaultSlideTheme
): Slide => ({
  id: crypto.randomUUID(),
  title,
  content,
  contentMode: 'markdown',
  theme: { ...theme },
  elements: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const parseMarkdownSlides = (content: string): Slide[] => {
  const slides = content.split('---').filter(slide => slide.trim());
  return slides.map((slideContent, index) => {
    const lines = slideContent.trim().split('\n');
    const title = lines.find(line => line.startsWith('# '))?.replace('# ', '') || `Slide ${index + 1}`;
    return createSlide(title, slideContent.trim());
  });
};

const useSlideStore = create<SlideStore>()(
  persist(
    temporal(
      immer((set, get) => ({
        slides: [
          createSlide(
            'Welcome',
            '# Welcome to Slide Editor\n\n- Create beautiful presentations\n- Write in Markdown or HTML\n- Customize colors and themes\n- Export to various formats\n\nStart editing to see the magic happen!'
          ),
        ],
        currentSlideId: null,
        isDarkMode: false,
        isPreviewMode: false,
        showColorPalette: false,
        currentTheme: predefinedThemes[0],
        predefinedThemes,
        selectedElementId: null,
        canvasSize: {
          width: 1280,
          height: 720,
        },

        addSlide: () => set((state) => {
          const newSlide = createSlide('New Slide', '# New Slide\n\nStart writing your content...', state.currentTheme.slideDefaults);
          state.slides.push(newSlide);
          state.currentSlideId = newSlide.id;
        }),

        duplicateSlide: (id: string) => set((state) => {
          const slideIndex = state.slides.findIndex(s => s.id === id);
          if (slideIndex !== -1) {
            const originalSlide = state.slides[slideIndex];
            const duplicatedSlide = createSlide(`${originalSlide.title} (Copy)`, originalSlide.content, originalSlide.theme);
            duplicatedSlide.contentMode = originalSlide.contentMode;
            duplicatedSlide.elements = originalSlide.elements.map(el => ({
              ...el,
              id: crypto.randomUUID(),
            }));
            state.slides.splice(slideIndex + 1, 0, duplicatedSlide);
            state.currentSlideId = duplicatedSlide.id;
          }
        }),

        deleteSlide: (id: string) => set((state) => {
          const slideIndex = state.slides.findIndex(s => s.id === id);
          if (slideIndex !== -1 && state.slides.length > 1) {
            state.slides.splice(slideIndex, 1);
            if (state.currentSlideId === id) {
              state.currentSlideId = state.slides[Math.min(slideIndex, state.slides.length - 1)]?.id || null;
            }
          }
        }),

        updateSlide: (id: string, updates: Partial<Slide>) => set((state) => {
          const slide = state.slides.find(s => s.id === id);
          if (slide) {
            const definedUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, value]) => value !== undefined)
            );
            Object.assign(slide, definedUpdates);
            slide.updatedAt = new Date();
            if (updates.content) {
              const lines = updates.content.split('\n');
              const title = lines.find(line => line.startsWith('# '))?.replace('# ', '');
              if (title) {
                slide.title = title;
              }
            }
          }
        }),

        updateSlideTheme: (id: string, theme: Partial<SlideTheme>) => set((state) => {
          const slide = state.slides.find(s => s.id === id);
          if (slide) {
            Object.assign(slide.theme, theme);
            slide.updatedAt = new Date();
          }
        }),

        reorderSlides: (startIndex: number, endIndex: number) => set((state) => {
          const [removed] = state.slides.splice(startIndex, 1);
          state.slides.splice(endIndex, 0, removed);
        }),

        setCurrentSlide: (id: string) => set({ currentSlideId: id, selectedElementId: null }),

        toggleDarkMode: () => set((state) => {
          state.isDarkMode = !state.isDarkMode;
        }),

        togglePreviewMode: () => set((state) => {
          state.isPreviewMode = !state.isPreviewMode;
        }),

        toggleColorPalette: () => set((state) => {
          state.showColorPalette = !state.showColorPalette;
        }),

        toggleContentMode: (id: string) => set((state) => {
          const slide = state.slides.find(s => s.id === id);
          if (slide) {
            const modes: Array<'markdown' | 'html' | 'canvas'> = ['markdown', 'html', 'canvas'];
            const currentIndex = modes.indexOf(slide.contentMode);
            slide.contentMode = modes[(currentIndex + 1) % modes.length];
            slide.updatedAt = new Date();
          }
        }),

        setCurrentTheme: (theme: AppTheme) => set({ currentTheme: theme }),

        addElement: (slideId: string, element: Omit<SlideElement, 'id'>) => set((state) => {
          const slide = state.slides.find(s => s.id === slideId);
          if (slide) {
            const newElement: SlideElement = {
              ...element,
              id: crypto.randomUUID(),
            };
            slide.elements.push(newElement);
            slide.updatedAt = new Date();
            state.selectedElementId = newElement.id;
          }
        }),

        updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => set((state) => {
          const slide = state.slides.find(s => s.id === slideId);
          if (slide) {
            const element = slide.elements.find(el => el.id === elementId);
            if (element) {
              Object.assign(element, updates);
              slide.updatedAt = new Date();
            }
          }
        }),

        deleteElement: (slideId: string, elementId: string) => set((state) => {
          const slide = state.slides.find(s => s.id === slideId);
          if (slide) {
            const elementIndex = slide.elements.findIndex(el => el.id === elementId);
            if (elementIndex !== -1) {
              slide.elements.splice(elementIndex, 1);
              slide.updatedAt = new Date();
              if (state.selectedElementId === elementId) {
                state.selectedElementId = null;
              }
            }
          }
        }),

        setSelectedElement: (elementId: string | null) => set({ selectedElementId: elementId }),

        importSlides: (content: string) => set((state) => {
          const newSlides = parseMarkdownSlides(content);
          if (newSlides.length > 0) {
            state.slides = newSlides;
            state.currentSlideId = newSlides[0].id;
          }
        }),

        exportSlides: () => get().slides.map(slide => slide.content).join('\n\n---\n\n'),

        exportToPowerPoint: () => {
          const { slides } = get();
          const pptx = new PptxGenJS();
          
          slides.forEach((slide) => {
            const pptxSlide = pptx.addSlide();
            
            // Set slide background
            if (slide.theme.useGradient && slide.theme.gradientFrom && slide.theme.gradientTo) {
              pptxSlide.background = {
                fill: {
                  type: 'gradient',
                  colors: [
                    { color: slide.theme.gradientFrom, position: 0 },
                    { color: slide.theme.gradientTo, position: 100 }
                  ]
                }
              };
            } else {
              pptxSlide.background = { fill: slide.theme.backgroundColor };
            }

            // Add canvas elements
            slide.elements.forEach((element) => {
              if (element.type === 'text') {
                pptxSlide.addText(element.content, {
                  x: (element.position.x / 1280) * 10, // Convert to inches
                  y: (element.position.y / 720) * 5.625,
                  w: (element.size.width / 1280) * 10,
                  h: (element.size.height / 720) * 5.625,
                  fontSize: element.style.fontSize || 16,
                  color: element.style.color || slide.theme.textColor,
                  fill: element.style.backgroundColor,
                  align: element.style.textAlign || 'left',
                  bold: element.style.fontWeight === 'bold',
                  italic: element.style.fontStyle === 'italic',
                });
              } else if (element.type === 'image') {
                pptxSlide.addImage({
                  data: element.content,
                  x: (element.position.x / 1280) * 10,
                  y: (element.position.y / 720) * 5.625,
                  w: (element.size.width / 1280) * 10,
                  h: (element.size.height / 720) * 5.625,
                });
              }
            });

            // Add markdown/HTML content if no canvas elements
            if (slide.elements.length === 0 && slide.content.trim()) {
              const title = slide.content.split('\n').find(line => line.startsWith('# '))?.replace('# ', '') || slide.title;
              const content = slide.content.replace(/^# .*\n/, '').trim();
              
              pptxSlide.addText(title, {
                x: 0.5, y: 0.5, w: 9, h: 1,
                fontSize: 32,
                color: slide.theme.textColor,
                bold: true,
                align: 'center'
              });

              if (content) {
                pptxSlide.addText(content, {
                  x: 0.5, y: 2, w: 9, h: 3,
                  fontSize: 16,
                  color: slide.theme.textColor,
                  align: 'left'
                });
              }
            }
          });

          pptx.writeFile({ fileName: 'presentation.pptx' });
        },

        exportToJSON: () => {
          const { slides, currentTheme } = get();
          const exportData = {
            metadata: {
              title: 'Slide Presentation',
              author: 'Slide Editor',
              theme: currentTheme,
              exportedAt: new Date().toISOString(),
            },
            slides: slides.map(slide => ({
              id: slide.id,
              title: slide.title,
              content: slide.content,
              contentMode: slide.contentMode,
              theme: slide.theme,
              elements: slide.elements,
              createdAt: slide.createdAt,
              updatedAt: slide.updatedAt,
            })),
          };

          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          saveAs(blob, 'presentation.json');
        },

        undo: () => get().temporal.getState().undo(),
        redo: () => get().temporal.getState().redo(),
        canUndo: () => get().temporal?.getState()?.pastStates.length > 0 || false,
        canRedo: () => get().temporal?.getState()?.futureStates.length > 0 || false,
      })),
      {
        limit: 50,
        equality: (pastState, currentState) => JSON.stringify(pastState.slides) === JSON.stringify(currentState.slides),
      }
    ),
    {
      name: 'slide-editor-storage',
      partialize: (state) => ({
        slides: state.slides,
        currentSlideId: state.currentSlideId,
        isDarkMode: state.isDarkMode,
        currentTheme: state.currentTheme,
        canvasSize: state.canvasSize,
      }),
    }
  )
);

export default useSlideStore;