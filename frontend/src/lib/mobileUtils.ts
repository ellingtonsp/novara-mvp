// Mobile utility classes and helpers
import { clsx, type ClassValue } from 'clsx';

// Responsive spacing utilities
export const mobileSpace = {
  // Vertical spacing
  y: {
    xs: 'space-y-2 sm:space-y-3',
    sm: 'space-y-3 sm:space-y-4', 
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
    xl: 'space-y-8 sm:space-y-12'
  },
  // Horizontal spacing
  x: {
    xs: 'space-x-1 sm:space-x-2',
    sm: 'space-x-2 sm:space-x-3',
    md: 'space-x-3 sm:space-x-4',
    lg: 'space-x-4 sm:space-x-6',
    xl: 'space-x-6 sm:space-x-8'
  }
};

// Responsive padding utilities
export const mobilePadding = {
  xs: 'p-3 sm:p-4',
  sm: 'p-4 sm:p-6',
  md: 'p-6 sm:p-8', 
  lg: 'p-8 sm:p-12',
  xl: 'p-12 sm:p-16',
  // Specific directions
  x: {
    xs: 'px-3 sm:px-4',
    sm: 'px-4 sm:px-6',
    md: 'px-6 sm:px-8',
    lg: 'px-8 sm:px-12'
  },
  y: {
    xs: 'py-3 sm:py-4',
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8',
    lg: 'py-8 sm:py-12'
  }
};

// Responsive text sizes
export const mobileText = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-2xl sm:text-4xl',
  '4xl': 'text-3xl sm:text-5xl',
  '5xl': 'text-4xl sm:text-6xl'
};

// Container utilities
export const mobileContainer = {
  sm: 'max-w-full sm:max-w-sm mx-auto px-4',
  md: 'max-w-full sm:max-w-md mx-auto px-4',
  lg: 'max-w-full sm:max-w-lg mx-auto px-4',
  xl: 'max-w-full sm:max-w-xl mx-auto px-4',
  '2xl': 'max-w-full sm:max-w-2xl mx-auto px-4',
  '4xl': 'max-w-full sm:max-w-4xl mx-auto px-4 sm:px-6',
  '6xl': 'max-w-full sm:max-w-6xl mx-auto px-4 sm:px-6'
};

// Button utilities
export const mobileButton = {
  // Ensure minimum touch target size of 44px
  base: 'min-h-[44px] px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all',
  sizes: {
    sm: 'min-h-[44px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2 text-sm sm:text-base',
    lg: 'min-h-[48px] px-6 py-3 text-base sm:text-lg'
  }
};

// Form input utilities
export const mobileInput = {
  base: 'w-full min-h-[44px] px-3 py-2 text-base rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2'
};

// Card utilities
export const mobileCard = {
  base: 'rounded-lg shadow-sm border',
  padding: {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }
};

// Helper function to combine mobile-optimized classes
export function mobileClasses(...classes: ClassValue[]) {
  return clsx(classes);
}

// Viewport height fix for mobile browsers
export function setMobileViewportHeight() {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
}

// Detect if user is on mobile device
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Detect if viewport is mobile size
export function isMobileViewport() {
  return window.innerWidth < 768;
}

// Prevent body scroll (useful for modals)
export function preventBodyScroll(prevent: boolean) {
  if (prevent) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
}