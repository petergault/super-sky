/**
 * Accessibility Tester
 * 
 * This file contains utilities for testing and improving the accessibility
 * of the Super Sky app.
 */

/**
 * Accessibility issues severity levels
 */
const SEVERITY = {
  CRITICAL: 'critical',
  SERIOUS: 'serious',
  MODERATE: 'moderate',
  MINOR: 'minor'
};

/**
 * WCAG 2.1 success criteria levels
 */
const WCAG_LEVEL = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
};

/**
 * Accessibility test results
 */
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

/**
 * Resets test results
 */
function resetTestResults() {
  testResults.passed = [];
  testResults.failed = [];
  testResults.warnings = [];
  testResults.summary = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };
}

/**
 * Adds a test result
 * @param {string} testName - The name of the test
 * @param {boolean} passed - Whether the test passed
 * @param {string} description - Description of the test
 * @param {string} severity - The severity of the issue (if failed)
 * @param {string} wcagCriteria - The WCAG criteria being tested
 * @param {string} wcagLevel - The WCAG level (A, AA, AAA)
 * @param {string} element - The element selector or description
 * @param {string} recommendation - Recommendation for fixing the issue
 */
function addTestResult(testName, passed, description, severity, wcagCriteria, wcagLevel, element, recommendation) {
  const result = {
    testName,
    passed,
    description,
    severity: passed ? null : severity,
    wcagCriteria,
    wcagLevel,
    element,
    recommendation: passed ? null : recommendation,
    timestamp: new Date().toISOString()
  };
  
  if (passed) {
    testResults.passed.push(result);
    testResults.summary.passed++;
  } else {
    testResults.failed.push(result);
    testResults.summary.failed++;
  }
  
  testResults.summary.total++;
}

/**
 * Adds a warning to the test results
 * @param {string} testName - The name of the test
 * @param {string} description - Description of the warning
 * @param {string} element - The element selector or description
 * @param {string} recommendation - Recommendation for addressing the warning
 */
function addWarning(testName, description, element, recommendation) {
  const warning = {
    testName,
    description,
    element,
    recommendation,
    timestamp: new Date().toISOString()
  };
  
  testResults.warnings.push(warning);
  testResults.summary.warnings++;
}

/**
 * Tests for proper heading structure
 * Headings should be properly nested (h1 -> h2 -> h3, etc.)
 */
function testHeadingStructure() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  let hasErrors = false;
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const level = parseInt(heading.tagName.substring(1), 10);
    
    // First heading should be h1
    if (i === 0 && level !== 1) {
      addTestResult(
        'Heading Structure',
        false,
        'First heading is not an h1',
        SEVERITY.SERIOUS,
        '1.3.1 Info and Relationships',
        WCAG_LEVEL.A,
        heading.outerHTML,
        'Change the first heading to an h1 element'
      );
      hasErrors = true;
    }
    
    // Heading levels should not skip (e.g., h2 -> h4)
    if (level > lastLevel + 1 && i > 0) {
      addTestResult(
        'Heading Structure',
        false,
        `Heading level skipped from h${lastLevel} to h${level}`,
        SEVERITY.MODERATE,
        '1.3.1 Info and Relationships',
        WCAG_LEVEL.A,
        heading.outerHTML,
        `Change this heading to an h${lastLevel + 1} or add missing heading levels`
      );
      hasErrors = true;
    }
    
    lastLevel = level;
  }
  
  if (!hasErrors) {
    addTestResult(
      'Heading Structure',
      true,
      'Headings are properly structured',
      null,
      '1.3.1 Info and Relationships',
      WCAG_LEVEL.A,
      'All headings',
      null
    );
  }
}

/**
 * Tests for proper alt text on images
 */
function testImageAltText() {
  const images = document.querySelectorAll('img');
  let hasErrors = false;
  
  images.forEach(img => {
    // Check if alt attribute exists
    if (!img.hasAttribute('alt')) {
      addTestResult(
        'Image Alt Text',
        false,
        'Image missing alt attribute',
        SEVERITY.CRITICAL,
        '1.1.1 Non-text Content',
        WCAG_LEVEL.A,
        img.outerHTML,
        'Add an alt attribute to the image'
      );
      hasErrors = true;
    } 
    // Check if alt text is empty for decorative images
    else if (img.alt === '' && !img.hasAttribute('role') && !img.hasAttribute('aria-hidden')) {
      addWarning(
        'Image Alt Text',
        'Decorative image with empty alt text should have role="presentation" or aria-hidden="true"',
        img.outerHTML,
        'Add role="presentation" or aria-hidden="true" to decorative images with empty alt text'
      );
    }
    // Check for generic alt text
    else if (/image|picture|photo/i.test(img.alt)) {
      addWarning(
        'Image Alt Text',
        'Image has generic alt text',
        img.outerHTML,
        'Replace generic alt text with more descriptive text'
      );
    }
  });
  
  if (!hasErrors && images.length > 0) {
    addTestResult(
      'Image Alt Text',
      true,
      'All images have alt attributes',
      null,
      '1.1.1 Non-text Content',
      WCAG_LEVEL.A,
      'All images',
      null
    );
  }
}

/**
 * Tests for proper color contrast
 * This is a simplified version that checks predefined color combinations
 */
function testColorContrast() {
  // Get all text elements
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, select, textarea');
  let hasErrors = false;
  
  textElements.forEach(element => {
    const style = window.getComputedStyle(element);
    const foregroundColor = style.color;
    const backgroundColor = getBackgroundColor(element);
    
    // Skip elements with transparent background
    if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      return;
    }
    
    // Skip elements with no text
    if (!element.textContent.trim()) {
      return;
    }
    
    // Calculate contrast ratio (simplified)
    const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
    const fontSize = parseInt(style.fontSize, 10);
    const isBold = parseInt(style.fontWeight, 10) >= 700;
    
    // WCAG 2.1 AA requires:
    // - 4.5:1 for normal text
    // - 3:1 for large text (18pt or 14pt bold)
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const requiredRatio = isLargeText ? 3 : 4.5;
    
    if (contrastRatio < requiredRatio) {
      addTestResult(
        'Color Contrast',
        false,
        `Insufficient contrast ratio: ${contrastRatio.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
        SEVERITY.SERIOUS,
        '1.4.3 Contrast (Minimum)',
        WCAG_LEVEL.AA,
        element.outerHTML,
        'Increase the contrast between the text and background colors'
      );
      hasErrors = true;
    }
  });
  
  if (!hasErrors && textElements.length > 0) {
    addTestResult(
      'Color Contrast',
      true,
      'All text elements have sufficient color contrast',
      null,
      '1.4.3 Contrast (Minimum)',
      WCAG_LEVEL.AA,
      'All text elements',
      null
    );
  }
}

/**
 * Gets the background color of an element, considering parent elements
 * @param {Element} element - The element to check
 * @returns {string} - The background color
 */
function getBackgroundColor(element) {
  const style = window.getComputedStyle(element);
  let backgroundColor = style.backgroundColor;
  
  // If background is transparent, check parent elements
  if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
    if (element.parentElement) {
      return getBackgroundColor(element.parentElement);
    }
  }
  
  return backgroundColor;
}

/**
 * Calculates the contrast ratio between two colors
 * @param {string} foreground - The foreground color
 * @param {string} background - The background color
 * @returns {number} - The contrast ratio
 */
function calculateContrastRatio(foreground, background) {
  // Convert colors to RGB
  const fgRGB = parseColor(foreground);
  const bgRGB = parseColor(background);
  
  // Calculate relative luminance
  const fgLuminance = calculateLuminance(fgRGB);
  const bgLuminance = calculateLuminance(bgRGB);
  
  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parses a CSS color string to RGB values
 * @param {string} color - The CSS color string
 * @returns {Object} - The RGB values
 */
function parseColor(color) {
  // Handle rgb/rgba format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }
  
  // Handle hex format
  if (color.startsWith('#')) {
    let hex = color.substring(1);
    
    // Convert shorthand hex to full hex
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  
  // Default to black if color format is not recognized
  return { r: 0, g: 0, b: 0 };
}

/**
 * Calculates the relative luminance of an RGB color
 * @param {Object} rgb - The RGB values
 * @returns {number} - The relative luminance
 */
function calculateLuminance(rgb) {
  // Convert RGB to sRGB
  const sRGB = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255
  };
  
  // Apply gamma correction
  const gammaCorrect = channel => {
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  
  const r = gammaCorrect(sRGB.r);
  const g = gammaCorrect(sRGB.g);
  const b = gammaCorrect(sRGB.b);
  
  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Tests for keyboard accessibility
 */
function testKeyboardAccessibility() {
  // Check for focusable elements without keyboard access
  const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
  let hasErrors = false;
  
  interactiveElements.forEach(element => {
    // Check for negative tabindex
    if (element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex'), 10) < 0) {
      // Skip elements that should be programmatically focused
      if (!element.hasAttribute('data-programmatic-focus')) {
        addTestResult(
          'Keyboard Accessibility',
          false,
          'Element with negative tabindex is not keyboard accessible',
          SEVERITY.SERIOUS,
          '2.1.1 Keyboard',
          WCAG_LEVEL.A,
          element.outerHTML,
          'Remove negative tabindex or ensure the element can be accessed by keyboard'
        );
        hasErrors = true;
      }
    }
    
    // Check for click handlers without keyboard handlers
    if (element._events && element._events.click && !element._events.keydown && !element._events.keyup && !element._events.keypress) {
      addWarning(
        'Keyboard Accessibility',
        'Element has click handler but no keyboard handler',
        element.outerHTML,
        'Add keyboard event handlers (keydown, keyup, or keypress) to elements with click handlers'
      );
    }
  });
  
  // Check for proper focus indicators
  const style = document.createElement('style');
  style.textContent = '* { outline: none !important; }';
  document.head.appendChild(style);
  
  // If outline is removed, it's an issue
  if (window.getComputedStyle(document.activeElement).outlineStyle === 'none') {
    addTestResult(
      'Keyboard Accessibility',
      false,
      'Focus indicators are removed with CSS',
      SEVERITY.SERIOUS,
      '2.4.7 Focus Visible',
      WCAG_LEVEL.AA,
      'CSS styles',
      'Remove CSS that hides focus indicators (outline: none) or provide alternative focus indicators'
    );
    hasErrors = true;
  }
  
  document.head.removeChild(style);
  
  if (!hasErrors) {
    addTestResult(
      'Keyboard Accessibility',
      true,
      'All interactive elements are keyboard accessible',
      null,
      '2.1.1 Keyboard',
      WCAG_LEVEL.A,
      'All interactive elements',
      null
    );
  }
}

/**
 * Tests for proper ARIA attributes
 */
function testAriaAttributes() {
  // Check for elements with ARIA attributes
  const elementsWithAria = document.querySelectorAll('[aria-*]');
  let hasErrors = false;
  
  elementsWithAria.forEach(element => {
    // Check for invalid ARIA roles
    if (element.hasAttribute('role')) {
      const role = element.getAttribute('role');
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ];
      
      if (!validRoles.includes(role)) {
        addTestResult(
          'ARIA Attributes',
          false,
          `Invalid ARIA role: ${role}`,
          SEVERITY.MODERATE,
          '4.1.2 Name, Role, Value',
          WCAG_LEVEL.A,
          element.outerHTML,
          `Replace "${role}" with a valid ARIA role`
        );
        hasErrors = true;
      }
    }
    
    // Check for required ARIA attributes
    if (element.hasAttribute('role')) {
      const role = element.getAttribute('role');
      
      // Some roles require specific attributes
      const requiredAttributes = {
        'checkbox': ['aria-checked'],
        'combobox': ['aria-expanded'],
        'listbox': ['aria-multiselectable'],
        'progressbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
        'radio': ['aria-checked'],
        'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
        'spinbutton': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
        'tablist': ['aria-orientation']
      };
      
      if (requiredAttributes[role]) {
        requiredAttributes[role].forEach(attr => {
          if (!element.hasAttribute(attr)) {
            addTestResult(
              'ARIA Attributes',
              false,
              `Missing required ARIA attribute: ${attr} for role ${role}`,
              SEVERITY.MODERATE,
              '4.1.2 Name, Role, Value',
              WCAG_LEVEL.A,
              element.outerHTML,
              `Add the ${attr} attribute to the element with role ${role}`
            );
            hasErrors = true;
          }
        });
      }
    }
  });
  
  if (!hasErrors && elementsWithAria.length > 0) {
    addTestResult(
      'ARIA Attributes',
      true,
      'All ARIA attributes are valid and complete',
      null,
      '4.1.2 Name, Role, Value',
      WCAG_LEVEL.A,
      'All elements with ARIA attributes',
      null
    );
  }
}

/**
 * Runs all accessibility tests
 */
function runAllTests() {
  resetTestResults();
  
  // Run all tests
  testHeadingStructure();
  testImageAltText();
  testColorContrast();
  testKeyboardAccessibility();
  testAriaAttributes();
  
  return testResults;
}

/**
 * Displays test results in the UI
 * @param {Object} results - The test results
 * @param {string} containerId - The ID of the container element
 */
function displayTestResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Create summary
  const summary = document.createElement('div');
  summary.className = 'a11y-summary';
  summary.innerHTML = `
    <h2>Accessibility Test Results</h2>
    <div class="a11y-stats">
      <div class="a11y-stat">
        <span class="a11y-stat-value">${results.summary.total}</span>
        <span class="a11y-stat-label">Total Tests</span>
      </div>
      <div class="a11y-stat">
        <span class="a11y-stat-value">${results.summary.passed}</span>
        <span class="a11y-stat-label">Passed</span>
      </div>
      <div class="a11y-stat">
        <span class="a11y-stat-value">${results.summary.failed}</span>
        <span class="a11y-stat-label">Failed</span>
      </div>
      <div class="a11y-stat">
        <span class="a11y-stat-value">${results.summary.warnings}</span>
        <span class="a11y-stat-label">Warnings</span>
      </div>
    </div>
  `;
  
  container.appendChild(summary);
  
  // Create results sections
  if (results.failed.length > 0) {
    const failedSection = createResultsSection('Failed Tests', results.failed, 'failed');
    container.appendChild(failedSection);
  }
  
  if (results.warnings.length > 0) {
    const warningsSection = createResultsSection('Warnings', results.warnings, 'warning');
    container.appendChild(warningsSection);
  }
  
  if (results.passed.length > 0) {
    const passedSection = createResultsSection('Passed Tests', results.passed, 'passed');
    container.appendChild(passedSection);
  }
}

/**
 * Creates a section for displaying test results
 * @param {string} title - The section title
 * @param {Array} items - The items to display
 * @param {string} type - The type of items (failed, warning, passed)
 * @returns {HTMLElement} - The created section element
 */
function createResultsSection(title, items, type) {
  const section = document.createElement('div');
  section.className = `a11y-section a11y-${type}`;
  
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.appendChild(heading);
  
  const list = document.createElement('ul');
  list.className = 'a11y-list';
  
  items.forEach(item => {
    const listItem = document.createElement('li');
    listItem.className = 'a11y-item';
    
    let content = `<strong>${item.testName}</strong>: ${item.description}`;
    
    if (item.element) {
      content += `<div class="a11y-element"><code>${item.element}</code></div>`;
    }
    
    if (item.recommendation) {
      content += `<div class="a11y-recommendation"><strong>Recommendation:</strong> ${item.recommendation}</div>`;
    }
    
    if (item.wcagCriteria && item.wcagLevel) {
      content += `<div class="a11y-wcag"><strong>WCAG:</strong> ${item.wcagCriteria} (${item.wcagLevel})</div>`;
    }
    
    listItem.innerHTML = content;
    list.appendChild(listItem);
  });
  
  section.appendChild(list);
  return section;
}

// Export the accessibility tester functions
window.accessibilityTester = {
  runAllTests,
  displayTestResults,
  SEVERITY,
  WCAG_LEVEL
};