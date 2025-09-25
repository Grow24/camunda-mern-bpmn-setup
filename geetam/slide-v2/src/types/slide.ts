export interface SlideTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  gradientFrom?: string;
  gradientTo?: string;
  useGradient: boolean;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    zIndex?: number;
  };
  content: string; // Text content or image URL/base64
  altText?: string; // For images
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  contentMode: 'markdown' | 'html' | 'canvas';
  theme: SlideTheme;
  elements: SlideElement[];
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
  selectedElementId: string | null;
  canvasSize: {
    width: number;
    height: number;
  };
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
  exportToPowerPoint: () => void;
  exportToJSON: () => void;
  addElement: (slideId: string, element: Omit<SlideElement, 'id'>) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  setSelectedElement: (elementId: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export type SlideStore = SlideState & SlideActions;