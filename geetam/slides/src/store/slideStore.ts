import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { Slide, SlideStore, SlideTheme, AppTheme } from '../types/slide';

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

        setCurrentSlide: (id: string) => set({ currentSlideId: id }),

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
            slide.contentMode = slide.contentMode === 'markdown' ? 'html' : 'markdown';
            slide.updatedAt = new Date();
          }
        }),

        setCurrentTheme: (theme: AppTheme) => set({ currentTheme: theme }),

        importSlides: (content: string) => set((state) => {
          const newSlides = parseMarkdownSlides(content);
          if (newSlides.length > 0) {
            state.slides = newSlides;
            state.currentSlideId = newSlides[0].id;
          }
        }),

        exportSlides: () => get().slides.map(slide => slide.content).join('\n\n---\n\n'),

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
      }),
    }
  )
);

export default useSlideStore;