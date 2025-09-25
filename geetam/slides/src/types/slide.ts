export interface SlideTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  gradientFrom?: string;
  gradientTo?: string;
  useGradient: boolean;
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  contentMode: 'markdown' | 'html';
  theme: SlideTheme;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppTheme {
  name: string;
  fontFamily: string;
  slideDefaults: SlideTheme;
}

export interface SlideState {
  slides: Slide[];
  currentSlideId: string | null;
  isDarkMode: boolean;
  isPreviewMode: boolean;
  showColorPalette: boolean;
  currentTheme: AppTheme;
  predefinedThemes: AppTheme[];
}

export interface SlideActions {
  addSlide: () => void;
  duplicateSlide: (id: string) => void;
  deleteSlide: (id: string) => void;
  updateSlide: (id: string, updates: Partial<Slide>) => void;
  updateSlideTheme: (id: string, theme: Partial<SlideTheme>) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;
  setCurrentSlide: (id: string) => void;
  toggleDarkMode: () => void;
  togglePreviewMode: () => void;
  toggleColorPalette: () => void;
  toggleContentMode: (id: string) => void;
  setCurrentTheme: (theme: AppTheme) => void;
  importSlides: (content: string) => void;
  exportSlides: () => string;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export type SlideStore = SlideState & SlideActions;