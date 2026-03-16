<script>
  import { onMount } from 'svelte';
  import { getJson, putJson } from '$lib/api';
  import { defaultStyleColors } from '$lib/defaultStyle';
  import StylePreview from '$lib/components/StylePreview.svelte';

  const colorFields = [
    { key: 'pageBg', label: 'Page Background' },
    { key: 'heroBg', label: 'Hero Background' },
    { key: 'heroText', label: 'Hero Text' },
    { key: 'productBg', label: 'Product Section Background' },
    { key: 'productText', label: 'Product Section Text' },
    { key: 'blogBg', label: 'Blog Section Background' },
    { key: 'blogText', label: 'Blog Section Text' },
    { key: 'pricingBg', label: 'Pricing Section Background' },
    { key: 'pricingText', label: 'Pricing Section Text' },
    { key: 'clientsBg', label: 'Clients Section Background' },
    { key: 'clientsText', label: 'Clients Section Text' },
    { key: 'footerBg', label: 'Footer Background' },
    { key: 'footerText', label: 'Footer Text' },
    { key: 'primaryButton', label: 'Primary Button' },
    { key: 'secondaryButton', label: 'Secondary Button' },
    { key: 'cardBg', label: 'Card Background' },
    { key: 'cardBorder', label: 'Card Border' }
  ];

  let loading = true;
  let saving = false;
  let error = '';

  let palettes = [];
  let selectedPalette = 'ocean-flat';
  let colors = { ...defaultStyleColors };

  async function loadStyleData() {
    loading = true;
    error = '';

    try {
      const [paletteData, styleData] = await Promise.all([
        getJson('/api/site/palettes'),
        getJson('/api/site/style')
      ]);

      palettes = paletteData.palettes || [];
      selectedPalette = styleData.style?.palette || palettes[0]?.key || 'ocean-flat';
      colors = {
        ...defaultStyleColors,
        ...(styleData.style?.colors || {})
      };
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function choosePalette(paletteKey) {
    const selected = palettes.find((item) => item.key === paletteKey);
    if (!selected) {
      return;
    }

    selectedPalette = selected.key;
    colors = {
      ...defaultStyleColors,
      ...(selected.colors || {})
    };
  }

  function updateColor(key, value) {
    colors = {
      ...colors,
      [key]: value
    };
  }

  async function saveStyle() {
    saving = true;
    error = '';

    try {
      await putJson('/api/site/style', {
        palette: selectedPalette,
        colors
      });
      await loadStyleData();
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  onMount(loadStyleData);
</script>

<div class="toolbar">
  <div>
    <h1 style="margin:0;">Style</h1>
    <p style="margin:0.2rem 0 0; color:#64748b;">
      Pilih palette flat design, custom warna section, dan preview hasil halaman.
    </p>
  </div>
  <button class="button-outline" on:click={loadStyleData}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  <h2 style="margin-top:0;">Palette Flat Design</h2>

  {#if loading}
    <p>Loading style...</p>
  {:else}
    <div class="palette-grid">
      {#each palettes as palette}
        <button
          class={`palette-card ${selectedPalette === palette.key ? 'active' : ''}`}
          on:click={() => choosePalette(palette.key)}
        >
          <strong>{palette.name}</strong>
          <div class="swatches">
            <span class="swatch" style={`background:${palette.colors.heroBg}`}></span>
            <span class="swatch" style={`background:${palette.colors.blogBg}`}></span>
            <span class="swatch" style={`background:${palette.colors.pricingBg}`}></span>
            <span class="swatch" style={`background:${palette.colors.footerBg}`}></span>
          </div>
        </button>
      {/each}
    </div>

    <h3 style="margin-top:1rem;">Custom Section Colors</h3>
    <div class="form-grid">
      {#each colorFields as field}
        <label>
          {field.label}
          <input
            type="color"
            value={colors[field.key]}
            on:input={(event) => updateColor(field.key, event.currentTarget.value)}
          />
        </label>
      {/each}
    </div>

    <div class="button-row" style="margin-top:0.8rem;">
      <button class="button-main" on:click={saveStyle} disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan Style'}
      </button>
    </div>
  {/if}
</section>

<section class="panel">
  <h2 style="margin-top:0;">Preview Halaman Web</h2>
  <p style="margin-top:0; color:#64748b;">Simulasi warna untuk hero, product, blog, pricing, clients, dan footer.</p>
  <StylePreview {colors} />
</section>
