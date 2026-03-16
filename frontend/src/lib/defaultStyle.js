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

export function createStyleVars(style) {
  const colors = {
    ...defaultStyleColors,
    ...(style?.colors || {})
  };

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
