import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Typography System Tests', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('CSS Custom Properties', () => {
    it('should define all required CSS custom properties', () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      expect(rootStyles.getPropertyValue('--font-size-base')).toBeTruthy();
      expect(rootStyles.getPropertyValue('--line-height-normal')).toBeTruthy();
      expect(rootStyles.getPropertyValue('--letter-spacing-normal')).toBeTruthy();
      expect(rootStyles.getPropertyValue('--font-weight-normal')).toBeTruthy();
    });

    it('should have valid font size values', () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const fontSizes = [
        '--font-size-xs',
        '--font-size-sm',
        '--font-size-base',
        '--font-size-lg',
        '--font-size-xl',
        '--font-size-2xl',
        '--font-size-3xl',
        '--font-size-4xl',
        '--font-size-5xl',
      ];

      fontSizes.forEach(size => {
        const value = rootStyles.getPropertyValue(size);
        expect(value).toMatch(/clamp\(|\d+(\.\d+)?(rem|px|em)/);
      });
    });

    it('should have valid line height values', () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const lineHeights = [
        '--line-height-tight',
        '--line-height-snug',
        '--line-height-normal',
        '--line-height-relaxed',
        '--line-height-loose',
      ];

      lineHeights.forEach(height => {
        const value = rootStyles.getPropertyValue(height);
        expect(parseFloat(value)).toBeGreaterThan(1);
        expect(parseFloat(value)).toBeLessThan(3);
      });
    });

    it('should have valid letter spacing values', () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const letterSpacings = [
        '--letter-spacing-tighter',
        '--letter-spacing-tight',
        '--letter-spacing-normal',
        '--letter-spacing-wide',
        '--letter-spacing-wider',
        '--letter-spacing-widest',
      ];

      letterSpacings.forEach(spacing => {
        const value = rootStyles.getPropertyValue(spacing);
        expect(value).toMatch(/-?\d+(\.\d+)?em/);
      });
    });

    it('should have valid font weight values', () => {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const fontWeights = [
        '--font-weight-thin',
        '--font-weight-extralight',
        '--font-weight-light',
        '--font-weight-normal',
        '--font-weight-medium',
        '--font-weight-semibold',
        '--font-weight-bold',
        '--font-weight-extrabold',
        '--font-weight-black',
      ];

      fontWeights.forEach(weight => {
        const value = rootStyles.getPropertyValue(weight);
        const numValue = parseInt(value);
        expect(numValue).toBeGreaterThanOrEqual(100);
        expect(numValue).toBeLessThanOrEqual(900);
        expect(numValue % 100).toBe(0);
      });
    });
  });

  describe('Typography Classes', () => {
    it('should apply display text styles correctly', () => {
      const element = document.createElement('h1');
      element.className = 'text-display';
      element.textContent = 'Display Text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.fontWeight).toBeTruthy();
      expect(styles.lineHeight).toBeTruthy();
    });

    it('should apply body text styles correctly', () => {
      const element = document.createElement('p');
      element.className = 'text-body';
      element.textContent = 'Body text content';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.lineHeight).toBeTruthy();
    });

    it('should apply caption text styles correctly', () => {
      const element = document.createElement('span');
      element.className = 'text-caption';
      element.textContent = 'Caption text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.letterSpacing).toBeTruthy();
    });

    it('should apply label text styles correctly', () => {
      const element = document.createElement('label');
      element.className = 'text-label';
      element.textContent = 'Label text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.fontWeight).toBeTruthy();
      expect(styles.textTransform).toBe('uppercase');
    });

    it('should apply button text styles correctly', () => {
      const element = document.createElement('button');
      element.className = 'text-button';
      element.textContent = 'Button';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.fontWeight).toBeTruthy();
      expect(styles.letterSpacing).toBeTruthy();
    });
  });

  describe('Font Weight Classes', () => {
    it('should apply thin font weight', () => {
      const element = document.createElement('div');
      element.className = 'font-weight-thin';
      element.textContent = 'Thin text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseInt(styles.fontWeight)).toBe(100);
    });

    it('should apply normal font weight', () => {
      const element = document.createElement('div');
      element.className = 'font-weight-normal';
      element.textContent = 'Normal text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseInt(styles.fontWeight)).toBe(400);
    });

    it('should apply bold font weight', () => {
      const element = document.createElement('div');
      element.className = 'font-weight-bold';
      element.textContent = 'Bold text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseInt(styles.fontWeight)).toBe(700);
    });

    it('should apply black font weight', () => {
      const element = document.createElement('div');
      element.className = 'font-weight-black';
      element.textContent = 'Black text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseInt(styles.fontWeight)).toBe(900);
    });
  });

  describe('Line Height Classes', () => {
    it('should apply tight line height', () => {
      const element = document.createElement('div');
      element.className = 'line-height-tight';
      element.textContent = 'Tight line height text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseFloat(styles.lineHeight)).toBe(1.25);
    });

    it('should apply normal line height', () => {
      const element = document.createElement('div');
      element.className = 'line-height-normal';
      element.textContent = 'Normal line height text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseFloat(styles.lineHeight)).toBe(1.5);
    });

    it('should apply loose line height', () => {
      const element = document.createElement('div');
      element.className = 'line-height-loose';
      element.textContent = 'Loose line height text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(parseFloat(styles.lineHeight)).toBe(2);
    });
  });

  describe('Letter Spacing Classes', () => {
    it('should apply tight letter spacing', () => {
      const element = document.createElement('div');
      element.className = 'letter-spacing-tight';
      element.textContent = 'Tight spacing';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.letterSpacing).toMatch(/-0\.025em/);
    });

    it('should apply normal letter spacing', () => {
      const element = document.createElement('div');
      element.className = 'letter-spacing-normal';
      element.textContent = 'Normal spacing';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.letterSpacing).toMatch(/0em/);
    });

    it('should apply wide letter spacing', () => {
      const element = document.createElement('div');
      element.className = 'letter-spacing-wide';
      element.textContent = 'Wide spacing';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.letterSpacing).toMatch(/0\.025em/);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust font sizes at different viewport widths', () => {
      const element = document.createElement('h1');
      element.className = 'text-display';
      element.textContent = 'Responsive text';
      container.appendChild(element);

      const originalWidth = window.innerWidth;
      
      window.innerWidth = 320;
      window.dispatchEvent(new Event('resize'));
      const mobileStyles = getComputedStyle(element);
      
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));
      const desktopStyles = getComputedStyle(element);
      
      window.innerWidth = originalWidth;
      window.dispatchEvent(new Event('resize'));

      expect(parseFloat(mobileStyles.fontSize)).toBeLessThanOrEqual(
        parseFloat(desktopStyles.fontSize)
      );
    });
  });

  describe('Accessibility Features', () => {
    it('should have focus-visible styles', () => {
      const element = document.createElement('button');
      element.textContent = 'Focusable element';
      container.appendChild(element);

      element.focus();
      element.dispatchEvent(new Event('focus', { bubbles: true }));

      const styles = getComputedStyle(element);
      expect(styles.outlineWidth).toBeTruthy();
    });

    it('should have skip link styles', () => {
      const element = document.createElement('a');
      element.className = 'skip-link';
      element.href = '#main-content';
      element.textContent = 'Skip to main content';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.position).toBe('absolute');
      expect(styles.zIndex).toBeTruthy();
    });

    it('should have visually-hidden styles', () => {
      const element = document.createElement('span');
      element.className = 'visually-hidden';
      element.textContent = 'Hidden text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.position).toBe('absolute');
      expect(styles.width).toBe('1px');
      expect(styles.height).toBe('1px');
      expect(styles.overflow).toBe('hidden');
    });
  });

  describe('Readability Classes', () => {
    it('should apply readable max-width', () => {
      const element = document.createElement('div');
      element.className = 'text-readable';
      element.textContent = 'Readable text content';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.maxWidth).toBeTruthy();
    });

    it('should apply readable-narrow max-width', () => {
      const element = document.createElement('div');
      element.className = 'text-readable-narrow';
      element.textContent = 'Narrow readable text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.maxWidth).toBeTruthy();
    });

    it('should apply readable-wide max-width', () => {
      const element = document.createElement('div');
      element.className = 'text-readable-wide';
      element.textContent = 'Wide readable text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.maxWidth).toBeTruthy();
    });
  });

  describe('Text Alignment Classes', () => {
    it('should apply left alignment', () => {
      const element = document.createElement('div');
      element.className = 'text-left';
      element.textContent = 'Left aligned text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textAlign).toBe('left');
    });

    it('should apply center alignment', () => {
      const element = document.createElement('div');
      element.className = 'text-center';
      element.textContent = 'Center aligned text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textAlign).toBe('center');
    });

    it('should apply right alignment', () => {
      const element = document.createElement('div');
      element.className = 'text-right';
      element.textContent = 'Right aligned text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textAlign).toBe('right');
    });
  });

  describe('Text Transform Classes', () => {
    it('should apply uppercase transform', () => {
      const element = document.createElement('div');
      element.className = 'uppercase';
      element.textContent = 'uppercase text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textTransform).toBe('uppercase');
    });

    it('should apply lowercase transform', () => {
      const element = document.createElement('div');
      element.className = 'lowercase';
      element.textContent = 'LOWERCASE TEXT';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textTransform).toBe('lowercase');
    });

    it('should apply capitalize transform', () => {
      const element = document.createElement('div');
      element.className = 'capitalize';
      element.textContent = 'capitalize text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textTransform).toBe('capitalize');
    });
  });

  describe('Text Decoration Classes', () => {
    it('should apply underline decoration', () => {
      const element = document.createElement('div');
      element.className = 'underline';
      element.textContent = 'Underlined text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textDecorationLine).toBe('underline');
    });

    it('should apply line-through decoration', () => {
      const element = document.createElement('div');
      element.className = 'line-through';
      element.textContent = 'Strikethrough text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textDecorationLine).toBe('line-through');
    });

    it('should apply no-underline decoration', () => {
      const element = document.createElement('div');
      element.className = 'no-underline';
      element.style.textDecoration = 'underline';
      element.textContent = 'No underline text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textDecorationLine).toBe('none');
    });
  });

  describe('Font Optimization Classes', () => {
    it('should apply optimized font rendering', () => {
      const element = document.createElement('div');
      element.className = 'font-optimized';
      element.textContent = 'Optimized text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textRendering).toBe('optimizeLegibility');
      expect(styles.webkitFontSmoothing).toBe('antialiased');
    });

    it('should apply fast font rendering', () => {
      const element = document.createElement('div');
      element.className = 'font-fast';
      element.textContent = 'Fast rendering text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.textRendering).toBe('optimizeSpeed');
    });
  });

  describe('Code Text Styles', () => {
    it('should apply code text styles', () => {
      const element = document.createElement('code');
      element.className = 'text-code';
      element.textContent = 'code text';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontFamily).toBeTruthy();
      expect(styles.fontSize).toBeTruthy();
    });

    it('should apply inline code styles', () => {
      const element = document.createElement('code');
      element.className = 'text-code-inline';
      element.textContent = 'inline code';
      container.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.padding).toBeTruthy();
      expect(styles.borderRadius).toBeTruthy();
    });
  });
});

describe('Typography Utility Functions', () => {
  describe('getTypographyStyle', () => {
    it('should return correct style for display text', () => {
      const style = getTypographyStyle('display');
      expect(style.fontSize).toBeTruthy();
      expect(style.fontWeight).toBeTruthy();
    });

    it('should return correct style for body text', () => {
      const style = getTypographyStyle('body');
      expect(style.fontSize).toBeTruthy();
      expect(style.lineHeight).toBeTruthy();
    });

    it('should return empty object for unknown style', () => {
      const style = getTypographyStyle('unknown');
      expect(style).toEqual({});
    });
  });

  describe('getHeadingStyle', () => {
    it('should return correct style for h1', () => {
      const style = getHeadingStyle(1);
      expect(style.fontSize).toBeTruthy();
      expect(style.fontWeight).toBeTruthy();
    });

    it('should return correct style for h6', () => {
      const style = getHeadingStyle(6);
      expect(style.fontSize).toBeTruthy();
      expect(style.fontWeight).toBeTruthy();
    });

    it('should return empty object for invalid level', () => {
      const style = getHeadingStyle(7);
      expect(style).toEqual({});
    });
  });

  describe('getOptimalLineHeight', () => {
    it('should return 1.5 for small fonts', () => {
      expect(getOptimalLineHeight('12px')).toBe(1.5);
    });

    it('should return 1.4 for medium-small fonts', () => {
      expect(getOptimalLineHeight('16px')).toBe(1.4);
    });

    it('should return 1.3 for medium fonts', () => {
      expect(getOptimalLineHeight('20px')).toBe(1.3);
    });

    it('should return 1.25 for large fonts', () => {
      expect(getOptimalLineHeight('24px')).toBe(1.25);
    });
  });

  describe('getOptimalLetterSpacing', () => {
    it('should return positive spacing for small fonts', () => {
      expect(getOptimalLetterSpacing('12px', '400')).toMatch(/0\.01em/);
    });

    it('should return normal spacing for medium fonts', () => {
      expect(getOptimalLetterSpacing('16px', '400')).toMatch(/0em/);
    });

    it('should return negative spacing for bold fonts', () => {
      expect(getOptimalLetterSpacing('16px', '700')).toMatch(/-0\.025em/);
    });

    it('should return tighter spacing for large bold fonts', () => {
      expect(getOptimalLetterSpacing('24px', '700')).toMatch(/-0\.05em/);
    });
  });
});

describe('Cross-Browser Compatibility Tests', () => {
  it('should work in Chrome', () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (isChrome) {
      const element = document.createElement('div');
      element.className = 'text-body';
      element.textContent = 'Chrome test';
      document.body.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.webkitFontSmoothing).toBeTruthy();

      document.body.removeChild(element);
    }
  });

  it('should work in Firefox', () => {
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isFirefox) {
      const element = document.createElement('div');
      element.className = 'text-body';
      element.textContent = 'Firefox test';
      document.body.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.MozOsxFontSmoothing).toBeTruthy();

      document.body.removeChild(element);
    }
  });

  it('should work in Safari', () => {
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    if (isSafari) {
      const element = document.createElement('div');
      element.className = 'text-body';
      element.textContent = 'Safari test';
      document.body.appendChild(element);

      const styles = getComputedStyle(element);
      expect(styles.fontSize).toBeTruthy();
      expect(styles.webkitFontSmoothing).toBeTruthy();

      document.body.removeChild(element);
    }
  });
});

describe('Performance Tests', () => {
  it('should not cause layout shifts', () => {
    const element = document.createElement('div');
    element.className = 'text-body';
    element.textContent = 'Performance test';
    container.appendChild(element);

    const initialHeight = element.offsetHeight;
    const initialWidth = element.offsetWidth;

    element.textContent = 'Updated performance test with more content';

    const finalHeight = element.offsetHeight;
    const finalWidth = element.offsetWidth;

    expect(finalHeight).toBeGreaterThanOrEqual(initialHeight);
    expect(finalWidth).toBeGreaterThanOrEqual(initialWidth);
  });

  it('should render quickly', () => {
    const start = performance.now();
    
    const element = document.createElement('div');
    element.className = 'text-display';
    element.textContent = 'Performance test';
    container.appendChild(element);

    const end = performance.now();
    const renderTime = end - start;

    expect(renderTime).toBeLessThan(16);
  });
});
