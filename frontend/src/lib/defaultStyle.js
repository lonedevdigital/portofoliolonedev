export const defaultStyleColors = {
  pageBg: '#f7f8fb',
  heroBg: '#06d6a0',
  heroText: '#073b4c',
  productBg: '#ffffff',
  productText: '#1f2937',
  blogBg: '#f1f5f9',
  blogText: '#1e293b',
  pricingBg: '#ffd166',
  pricingText: '#3f3f46',
  clientsBg: '#ffffff',
  clientsText: '#1f2937',
  footerBg: '#073b4c',
  footerText: '#f8fafc',
  primaryButton: '#118ab2',
  secondaryButton: '#ef476f',
  cardBg: '#ffffff',
  cardBorder: '#dbe4ef'
};

const styleContrastPairs = [
  ['heroBg', 'heroText'],
  ['productBg', 'productText'],
  ['blogBg', 'blogText'],
  ['pricingBg', 'pricingText'],
  ['clientsBg', 'clientsText'],
  ['footerBg', 'footerText']
];

function parseHexColor(colorValue) {
  if (typeof colorValue !== 'string') {
    return null;
  }

  const value = colorValue.trim().toLowerCase();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16)
    };
  }

  const fullMatch = /^#([0-9a-f]{6})$/i.exec(value);
  if (!fullMatch) {
    return null;
  }

  return {
    r: Number.parseInt(fullMatch[1].slice(0, 2), 16),
    g: Number.parseInt(fullMatch[1].slice(2, 4), 16),
    b: Number.parseInt(fullMatch[1].slice(4, 6), 16)
  };
}

function isNearWhite(colorValue) {
  const rgb = parseHexColor(colorValue);
  if (!rgb) {
    return false;
  }

  return rgb.r >= 244 && rgb.g >= 244 && rgb.b >= 244;
}

export function enforceReadableStyleColors(colors = {}) {
  const next = {
    ...defaultStyleColors,
    ...(colors || {})
  };

  for (const [bgKey, textKey] of styleContrastPairs) {
    if (isNearWhite(next[bgKey]) && isNearWhite(next[textKey])) {
      next[textKey] = '#0f172a';
    }
  }

  return next;
}

export function createStyleVars(style) {
  const colors = enforceReadableStyleColors(style?.colors || {});

  return {
    '--page-bg': colors.pageBg,
    '--hero-bg': colors.heroBg,
    '--hero-text': colors.heroText,
    '--product-bg': colors.productBg,
    '--product-text': colors.productText,
    '--blog-bg': colors.blogBg,
    '--blog-text': colors.blogText,
    '--pricing-bg': colors.pricingBg,
    '--pricing-text': colors.pricingText,
    '--clients-bg': colors.clientsBg,
    '--clients-text': colors.clientsText,
    '--footer-bg': colors.footerBg,
    '--footer-text': colors.footerText,
    '--primary-btn': colors.primaryButton,
    '--secondary-btn': colors.secondaryButton,
    '--card-bg': colors.cardBg,
    '--card-border': colors.cardBorder
  };
}