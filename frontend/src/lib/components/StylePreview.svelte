<script>
  import { defaultStyleColors } from '$lib/defaultStyle';

  export let colors = {};

  $: merged = { ...defaultStyleColors, ...(colors || {}) };
  $: previewStyle = [
    `--preview-page-bg: ${merged.pageBg}`,
    `--preview-hero-bg: ${merged.heroBg}`,
    `--preview-hero-text: ${merged.heroText}`,
    `--preview-product-bg: ${merged.productBg}`,
    `--preview-product-text: ${merged.productText}`,
    `--preview-blog-bg: ${merged.blogBg}`,
    `--preview-blog-text: ${merged.blogText}`,
    `--preview-pricing-bg: ${merged.pricingBg}`,
    `--preview-pricing-text: ${merged.pricingText}`,
    `--preview-clients-bg: ${merged.clientsBg}`,
    `--preview-clients-text: ${merged.clientsText}`,
    `--preview-footer-bg: ${merged.footerBg}`,
    `--preview-footer-text: ${merged.footerText}`,
    `--preview-card-bg: ${merged.cardBg}`,
    `--preview-card-border: ${merged.cardBorder}`
  ].join(';');
</script>

<div class="preview-shell" style={previewStyle}>
  <div class="preview-hero" style="background: var(--preview-hero-bg); color: var(--preview-hero-text);">
    <strong>Hero Section</strong>
    <div class="preview-row" style="grid-template-columns: 1fr 1fr;">
      <div class="preview-box"></div>
      <div class="preview-box"></div>
    </div>
  </div>

  <div class="preview-row" style="background: var(--preview-product-bg); color: var(--preview-product-text);">
    <div class="preview-box"></div>
    <div class="preview-box"></div>
  </div>

  <div class="preview-row" style="background: var(--preview-blog-bg); color: var(--preview-blog-text);">
    <div class="preview-box"></div>
    <div class="preview-box"></div>
  </div>

  <div class="preview-row" style="background: var(--preview-pricing-bg); color: var(--preview-pricing-text);">
    <div class="preview-box"></div>
    <div class="preview-box"></div>
  </div>

  <div class="preview-row" style="background: var(--preview-clients-bg); color: var(--preview-clients-text);">
    <div class="preview-box"></div>
    <div class="preview-box"></div>
  </div>

  <div class="preview-footer" style="background: var(--preview-footer-bg); color: var(--preview-footer-text);">
    <strong>Footer</strong>
  </div>
</div>
