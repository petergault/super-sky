/**
 * Performance Optimizer
 * 
 * This file contains utilities for optimizing the performance of the Super Sky app.
 * It implements lazy loading, rendering optimizations, and data caching strategies.
 */

/**
 * Intersection Observer configuration
 */
const observerOptions = {
  root: null, // Use viewport as root
  rootMargin: '100px', // Load elements when they're within 100px of viewport
  threshold: 0.1 // Trigger when at least 10% of element is visible
};

/**
 * Map to store observers for different components
 */
const observerMap = new Map();

/**
 * Creates a lazy loading observer for a specific component type
 * @param {string} componentType - The type of component to observe
 * @param {Function} loadCallback - Callback function to execute when element is visible
 * @returns {IntersectionObserver} - The created observer
 */
function createLazyLoadObserver(componentType, loadCallback) {
  if (observerMap.has(componentType)) {
    return observerMap.get(componentType);
  }
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Call the load callback with the target element
        loadCallback(entry.target);
        
        // Stop observing this element
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  observerMap.set(componentType, observer);
  return observer;
}

/**
 * Initializes lazy loading for hourly forecast data
 * This prevents loading all hourly data at once, improving initial load time
 */
function initHourlyLazyLoading() {
  // Create observer for hourly data sections
  const hourlyObserver = createLazyLoadObserver('hourly', (element) => {
    // Get the day index from the element's data attribute
    const dayIndex = parseInt(element.dataset.dayIndex, 10);
    
    // Load hourly data for this day
    if (window.hourlyComparisonGrid && typeof window.hourlyComparisonGrid.loadHourlyDataForDay === 'function') {
      window.hourlyComparisonGrid.loadHourlyDataForDay(dayIndex);
    }
    
    // Mark as loaded
    element.classList.add('loaded');
  });
  
  // Find all hourly data containers and observe them
  document.querySelectorAll('.hourly-day-container[data-day-index]').forEach(element => {
    hourlyObserver.observe(element);
  });
}

/**
 * Initializes lazy loading for comparison view sections
 */
function initComparisonLazyLoading() {
  // Create observer for comparison sections
  const comparisonObserver = createLazyLoadObserver('comparison', (element) => {
    // Get the section type from the element's data attribute
    const sectionType = element.dataset.sectionType;
    
    // Load data for this section
    if (window.comparisonView && typeof window.comparisonView.loadSectionData === 'function') {
      window.comparisonView.loadSectionData(sectionType);
    }
    
    // Mark as loaded
    element.classList.add('loaded');
  });
  
  // Find all comparison sections and observe them
  document.querySelectorAll('.comparison-section[data-section-type]').forEach(element => {
    comparisonObserver.observe(element);
  });
}

/**
 * Initializes lazy loading for images
 */
function initImageLazyLoading() {
  // Create observer for images
  const imageObserver = createLazyLoadObserver('image', (element) => {
    // Set the src attribute from data-src
    if (element.dataset.src) {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }
    
    // Mark as loaded
    element.classList.add('loaded');
  });
  
  // Find all images with data-src attribute and observe them
  document.querySelectorAll('img[data-src]').forEach(element => {
    imageObserver.observe(element);
  });
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @param {boolean} immediate - Whether to call the function immediately
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Optimizes rendering by batching DOM updates
 * @param {Function} updateFn - The function that updates the DOM
 */
function batchDomUpdates(updateFn) {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    updateFn();
  });
}

/**
 * Optimizes data fetching by implementing a request queue
 * This prevents multiple simultaneous requests for the same data
 */
const requestQueue = {
  queue: new Map(),
  
  /**
   * Adds a request to the queue or returns an existing one
   * @param {string} key - The request key (e.g., 'weather-10001')
   * @param {Function} requestFn - The function that makes the request
   * @returns {Promise} - Promise that resolves with the request result
   */
  enqueue(key, requestFn) {
    // If this request is already in progress, return its promise
    if (this.queue.has(key)) {
      return this.queue.get(key);
    }
    
    // Create a new promise for this request
    const promise = requestFn().finally(() => {
      // Remove from queue when done
      this.queue.delete(key);
    });
    
    // Add to queue
    this.queue.set(key, promise);
    
    return promise;
  },
  
  /**
   * Clears the request queue
   */
  clear() {
    this.queue.clear();
  }
};

/**
 * Optimizes data fetching by implementing a memory cache
 * This prevents redundant API calls for recently fetched data
 */
const memoryCache = {
  cache: new Map(),
  maxAge: 5 * 60 * 1000, // 5 minutes
  
  /**
   * Gets a value from the cache
   * @param {string} key - The cache key
   * @returns {*} - The cached value or undefined if not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // Check if entry is expired
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  },
  
  /**
   * Sets a value in the cache
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Clean up old entries if cache is getting too large
    if (this.cache.size > 100) {
      this.cleanup();
    }
  },
  
  /**
   * Removes expired entries from the cache
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  },
  
  /**
   * Clears the cache
   */
  clear() {
    this.cache.clear();
  }
};

/**
 * Optimizes component rendering by implementing a virtual DOM-like approach
 * This prevents unnecessary re-renders when data hasn't changed
 */
const renderOptimizer = {
  /**
   * Checks if a component needs to be re-rendered
   * @param {string} componentId - The component ID
   * @param {Object} newProps - The new props
   * @returns {boolean} - Whether the component needs to be re-rendered
   */
  shouldUpdate(componentId, newProps) {
    const prevProps = this.getComponentProps(componentId);
    
    // If no previous props, always update
    if (!prevProps) {
      this.setComponentProps(componentId, newProps);
      return true;
    }
    
    // Compare props to determine if update is needed
    const hasChanged = this.havePropsChanged(prevProps, newProps);
    
    // Update stored props if changed
    if (hasChanged) {
      this.setComponentProps(componentId, newProps);
    }
    
    return hasChanged;
  },
  
  /**
   * Gets the stored props for a component
   * @param {string} componentId - The component ID
   * @returns {Object|null} - The stored props or null if not found
   */
  getComponentProps(componentId) {
    const propsJson = sessionStorage.getItem(`component_props_${componentId}`);
    return propsJson ? JSON.parse(propsJson) : null;
  },
  
  /**
   * Sets the stored props for a component
   * @param {string} componentId - The component ID
   * @param {Object} props - The props to store
   */
  setComponentProps(componentId, props) {
    sessionStorage.setItem(`component_props_${componentId}`, JSON.stringify(props));
  },
  
  /**
   * Compares two objects to determine if they have changed
   * @param {Object} prevProps - The previous props
   * @param {Object} newProps - The new props
   * @returns {boolean} - Whether the props have changed
   */
  havePropsChanged(prevProps, newProps) {
    // Simple comparison for primitive types
    if (prevProps === newProps) {
      return false;
    }
    
    // If either is not an object, they're different
    if (typeof prevProps !== 'object' || typeof newProps !== 'object' || 
        prevProps === null || newProps === null) {
      return true;
    }
    
    // Get keys from both objects
    const prevKeys = Object.keys(prevProps);
    const newKeys = Object.keys(newProps);
    
    // If number of keys is different, they've changed
    if (prevKeys.length !== newKeys.length) {
      return true;
    }
    
    // Check each key
    for (const key of prevKeys) {
      const prevValue = prevProps[key];
      const newValue = newProps[key];
      
      // Recursively check objects
      if (typeof prevValue === 'object' && prevValue !== null && 
          typeof newValue === 'object' && newValue !== null) {
        if (this.havePropsChanged(prevValue, newValue)) {
          return true;
        }
      } 
      // For non-objects, do a simple comparison
      else if (prevValue !== newValue) {
        return true;
      }
    }
    
    return false;
  }
};

/**
 * Initializes all performance optimizations
 */
function initPerformanceOptimizations() {
  // Initialize lazy loading
  initHourlyLazyLoading();
  initComparisonLazyLoading();
  initImageLazyLoading();
  
  // Add event listeners with throttling for scroll events
  window.addEventListener('scroll', throttle(() => {
    // Check if any new elements need to be loaded
    observerMap.forEach(observer => {
      // The observer will handle loading as needed
    });
  }, 100));
  
  // Optimize resize events
  window.addEventListener('resize', debounce(() => {
    // Update layout if needed
    if (window.updateLayout) {
      window.updateLayout();
    }
  }, 200));
  
  console.log('Performance optimizations initialized');
}

// Export the performance optimizer functions
window.performanceOptimizer = {
  initPerformanceOptimizations,
  createLazyLoadObserver,
  debounce,
  throttle,
  batchDomUpdates,
  requestQueue,
  memoryCache,
  renderOptimizer
};