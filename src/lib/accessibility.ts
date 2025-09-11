/**
 * Accessibility utilities for WCAG 2.2 AA compliance
 * UiQ Community Platform
 */

// Focus trap utilities
export class FocusTrap {
  private focusableElements!: NodeListOf<HTMLElement>
  private firstFocusableElement!: HTMLElement | null
  private lastFocusableElement!: HTMLElement | null
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.updateFocusableElements()
  }

  private updateFocusableElements() {
    const focusableSelector = `
      a[href]:not([disabled]),
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      details:not([disabled]),
      summary:not(:disabled)
    `
    
    this.focusableElements = this.container.querySelectorAll(focusableSelector)
    this.firstFocusableElement = this.focusableElements[0] || null
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null
  }

  trap = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    // Update in case DOM changed
    this.updateFocusableElements()

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault()
        this.lastFocusableElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault()
        this.firstFocusableElement?.focus()
      }
    }
  }

  activate() {
    document.addEventListener('keydown', this.trap)
    
    // Focus first element if no element is focused within container
    if (!this.container.contains(document.activeElement)) {
      this.firstFocusableElement?.focus()
    }
  }

  deactivate() {
    document.removeEventListener('keydown', this.trap)
  }
}

// Live region announcements
export class LiveRegion {
  private static instance: LiveRegion
  private politeRegion: HTMLElement
  private assertiveRegion: HTMLElement

  private constructor() {
    this.politeRegion = this.createLiveRegion('polite')
    this.assertiveRegion = this.createLiveRegion('assertive')
    document.body.appendChild(this.politeRegion)
    document.body.appendChild(this.assertiveRegion)
  }

  static getInstance(): LiveRegion {
    if (!LiveRegion.instance) {
      LiveRegion.instance = new LiveRegion()
    }
    return LiveRegion.instance
  }

  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div')
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    return region
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'polite' ? this.politeRegion : this.assertiveRegion
    
    // Clear and set message
    region.textContent = ''
    setTimeout(() => {
      region.textContent = message
    }, 100)

    // Clear after announcement
    setTimeout(() => {
      region.textContent = ''
    }, 1000)
  }
}

// Color contrast utilities
export const colorContrast = {
  // WCAG 2.2 AA requires 4.5:1 for normal text, 3:1 for large text
  validateContrast: (foreground: string, background: string): { ratio: number; isCompliant: boolean; level: string } => {
    const fgLuminance = colorContrast.getLuminance(foreground)
    const bgLuminance = colorContrast.getLuminance(background)
    const ratio = colorContrast.getContrastRatio(fgLuminance, bgLuminance)
    
    return {
      ratio,
      isCompliant: ratio >= 4.5,
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL'
    }
  },

  getLuminance: (color: string): number => {
    const rgb = colorContrast.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  },

  getContrastRatio: (l1: number, l2: number): number => {
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  },

  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

// Keyboard navigation utilities
export const keyboardNav = {
  // Handle arrow key navigation for grids and lists
  handleArrowKeys: (
    event: KeyboardEvent,
    items: NodeListOf<HTMLElement> | HTMLElement[],
    currentIndex: number,
    columns: number = 1
  ): number => {
    const itemsArray = Array.from(items)
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        newIndex = currentIndex + columns
        if (newIndex >= itemsArray.length) {
          newIndex = currentIndex % columns // Stay in same column, go to first row
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        newIndex = currentIndex - columns
        if (newIndex < 0) {
          // Go to last item in same column
          const column = currentIndex % columns
          newIndex = Math.floor((itemsArray.length - 1) / columns) * columns + column
          if (newIndex >= itemsArray.length) newIndex -= columns
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        newIndex = currentIndex + 1
        if (newIndex >= itemsArray.length) newIndex = 0
        break
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = itemsArray.length - 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = itemsArray.length - 1
        break
    }

    if (newIndex !== currentIndex && itemsArray[newIndex]) {
      itemsArray[newIndex].focus()
      return newIndex
    }

    return currentIndex
  },

  // Create roving tabindex for component groups
  createRovingTabindex: (items: HTMLElement[], activeIndex: number = 0) => {
    items.forEach((item, index) => {
      item.tabIndex = index === activeIndex ? 0 : -1
    })
  }
}

// Screen reader utilities
export const screenReader = {
  // Generate unique IDs for form labels and descriptions
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Create accessible form descriptions
  createDescription: (text: string, id?: string): HTMLElement => {
    const desc = document.createElement('div')
    desc.id = id || screenReader.generateId('desc')
    desc.textContent = text
    desc.className = 'sr-only'
    return desc
  },

  // Announce page navigation changes
  announcePageChange: (pageName: string) => {
    LiveRegion.getInstance().announce(`Navigated to ${pageName}`, 'assertive')
  },

  // Announce form validation
  announceValidation: (fieldName: string, error?: string) => {
    const message = error 
      ? `${fieldName} has an error: ${error}`
      : `${fieldName} is valid`
    LiveRegion.getInstance().announce(message, 'assertive')
  }
}

// Skip link utilities
export const skipLinks = {
  create: (): HTMLElement => {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg'
    return skipLink
  },

  addToPage: () => {
    const existing = document.getElementById('skip-link')
    if (existing) return

    const skipLink = skipLinks.create()
    skipLink.id = 'skip-link'
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

// Reduced motion utilities
export const reducedMotion = {
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  respectMotionPreference: (element: HTMLElement, animationClass: string) => {
    if (!reducedMotion.prefersReducedMotion()) {
      element.classList.add(animationClass)
    }
  }
}

// ARIA utilities
export const aria = {
  // Set up accessible menu/dropdown
  setupMenuButton: (button: HTMLElement, menu: HTMLElement, menuItems: HTMLElement[]) => {
    const menuId = screenReader.generateId('menu')
    
    button.setAttribute('aria-haspopup', 'true')
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', menuId)
    
    menu.setAttribute('role', 'menu')
    menu.id = menuId
    
    menuItems.forEach(item => {
      item.setAttribute('role', 'menuitem')
      item.tabIndex = -1
    })
  },

  // Toggle menu state
  toggleMenu: (button: HTMLElement, menu: HTMLElement, isOpen: boolean) => {
    button.setAttribute('aria-expanded', isOpen.toString())
    
    if (isOpen) {
      const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement
      firstItem?.focus()
    } else {
      button.focus()
    }
  },

  // Setup accessible tabs
  setupTabs: (tabList: HTMLElement, tabs: HTMLElement[], panels: HTMLElement[]) => {
    tabList.setAttribute('role', 'tablist')
    
    tabs.forEach((tab, index) => {
      const tabId = screenReader.generateId('tab')
      const panelId = screenReader.generateId('panel')
      
      tab.setAttribute('role', 'tab')
      tab.id = tabId
      tab.setAttribute('aria-controls', panelId)
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false')
      tab.tabIndex = index === 0 ? 0 : -1
      
      if (panels[index]) {
        panels[index].setAttribute('role', 'tabpanel')
        panels[index].id = panelId
        panels[index].setAttribute('aria-labelledby', tabId)
        panels[index].setAttribute('tabindex', '0')
      }
    })
  }
}

// Focus management
export const focusManagement = {
  // Store and restore focus for modals
  storeFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement
  },

  restoreFocus: (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus()
    }
  },

  // Focus first error in form
  focusFirstError: (container: HTMLElement) => {
    const firstError = container.querySelector('[aria-invalid="true"], .error') as HTMLElement
    if (firstError) {
      firstError.focus()
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

// Initialize accessibility features
export const initializeA11y = () => {
  // Add skip links
  skipLinks.addToPage()
  
  // Initialize live regions
  LiveRegion.getInstance()
  
  // Add reduced motion CSS if preference is set
  if (reducedMotion.prefersReducedMotion()) {
    document.documentElement.classList.add('reduce-motion')
  }
}

// Export everything as default for easy importing
export default {
  FocusTrap,
  LiveRegion,
  colorContrast,
  keyboardNav,
  screenReader,
  skipLinks,
  reducedMotion,
  aria,
  focusManagement,
  initializeA11y
}