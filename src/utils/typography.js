export const typography = {
  fontFamilies: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
  },

  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
  },

  fontWeight: {
    thin: 'var(--font-weight-thin)',
    extralight: 'var(--font-weight-extralight)',
    light: 'var(--font-weight-light)',
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
    extrabold: 'var(--font-weight-extrabold)',
    black: 'var(--font-weight-black)',
  },

  lineHeight: {
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },

  letterSpacing: {
    tighter: 'var(--letter-spacing-tighter)',
    tight: 'var(--letter-spacing-tight)',
    normal: 'var(--letter-spacing-normal)',
    wide: 'var(--letter-spacing-wide)',
    wider: 'var(--letter-spacing-wider)',
    widest: 'var(--letter-spacing-widest)',
  },

  textStyles: {
    display: {
      fontSize: 'var(--font-size-5xl)',
      fontWeight: 'var(--font-weight-extrabold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tighter)',
    },
    headline: {
      fontSize: 'var(--font-size-4xl)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    title: {
      fontSize: 'var(--font-size-3xl)',
      fontWeight: 'var(--font-weight-semibold)',
      lineHeight: 'var(--line-height-snug)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    subtitle: {
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-semibold)',
      lineHeight: 'var(--line-height-snug)',
    },
    bodyLarge: {
      fontSize: 'var(--font-size-lg)',
      lineHeight: 'var(--line-height-relaxed)',
    },
    body: {
      fontSize: 'var(--font-size-base)',
      lineHeight: 'var(--line-height-relaxed)',
    },
    bodySmall: {
      fontSize: 'var(--font-size-sm)',
      lineHeight: 'var(--line-height-normal)',
    },
    caption: {
      fontSize: 'var(--font-size-xs)',
      lineHeight: 'var(--line-height-normal)',
      letterSpacing: 'var(--letter-spacing-wide)',
    },
    label: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-medium)',
      letterSpacing: 'var(--letter-spacing-wide)',
      textTransform: 'uppercase',
    },
    button: {
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)',
      letterSpacing: 'var(--letter-spacing-wide)',
    },
    link: {
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
    },
    code: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-sm)',
      lineHeight: 'var(--line-height-normal)',
    },
  },

  headingLevels: {
    h1: {
      fontSize: 'var(--font-size-5xl)',
      fontWeight: 'var(--font-weight-extrabold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tighter)',
    },
    h2: {
      fontSize: 'var(--font-size-4xl)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    h3: {
      fontSize: 'var(--font-size-3xl)',
      fontWeight: 'var(--font-weight-semibold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    h4: {
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-semibold)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    h5: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: 'var(--font-weight-medium)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
    h6: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'var(--font-weight-medium)',
      lineHeight: 'var(--line-height-tight)',
      letterSpacing: 'var(--letter-spacing-tight)',
    },
  },

  readability: {
    maxWidth: {
      normal: '65ch',
      narrow: '45ch',
      wide: '85ch',
    },
  },

  accessibility: {
    contrastRatio: {
      minimum: 4.5,
      enhanced: 7,
    },
    focusVisible: {
      outlineWidth: '2px',
      outlineOffset: '2px',
    },
  },
};

export const getTypographyStyle = (styleName) => {
  return typography.textStyles[styleName] || {};
};

export const getHeadingStyle = (level) => {
  return typography.headingLevels[`h${level}`] || {};
};

export const createResponsiveStyle = (baseStyle, responsiveStyles = {}) => {
  return {
    ...baseStyle,
    ...responsiveStyles,
  };
};

export const getOptimalLineHeight = (fontSize) => {
  const baseSize = parseFloat(fontSize);
  if (baseSize < 14) return 1.5;
  if (baseSize < 18) return 1.4;
  if (baseSize < 24) return 1.3;
  return 1.25;
};

export const getOptimalLetterSpacing = (fontSize, weight) => {
  const baseSize = parseFloat(fontSize);
  const baseWeight = parseInt(weight);
  
  if (baseWeight >= 700) {
    if (baseSize < 14) return '-0.02em';
    if (baseSize < 18) return '-0.025em';
    return '-0.05em';
  }
  
  if (baseSize < 14) return '0.01em';
  if (baseSize < 18) return '0';
  return '-0.01em';
};

export const typographyClasses = {
  display: 'text-display',
  headline: 'text-headline',
  title: 'text-title',
  subtitle: 'text-subtitle',
  bodyLarge: 'text-body-large',
  body: 'text-body',
  bodySmall: 'text-body-small',
  caption: 'text-caption',
  label: 'text-label',
  button: 'text-button',
  link: 'text-link',
  code: 'text-code',
  codeInline: 'text-code-inline',
  readable: 'text-readable',
  readableNarrow: 'text-readable-narrow',
  readableWide: 'text-readable-wide',
  optimized: 'font-optimized',
  fast: 'font-fast',
};

export const weightClasses = {
  thin: 'font-weight-thin',
  extralight: 'font-weight-extralight',
  light: 'font-weight-light',
  normal: 'font-weight-normal',
  medium: 'font-weight-medium',
  semibold: 'font-weight-semibold',
  bold: 'font-weight-bold',
  extrabold: 'font-weight-extrabold',
  black: 'font-weight-black',
};

export const lineHeightClasses = {
  tight: 'line-height-tight',
  snug: 'line-height-snug',
  normal: 'line-height-normal',
  relaxed: 'line-height-relaxed',
  loose: 'line-height-loose',
};

export const letterSpacingClasses = {
  tighter: 'letter-spacing-tighter',
  tight: 'letter-spacing-tight',
  normal: 'letter-spacing-normal',
  wide: 'letter-spacing-wide',
  wider: 'letter-spacing-wider',
  widest: 'letter-spacing-widest',
};
