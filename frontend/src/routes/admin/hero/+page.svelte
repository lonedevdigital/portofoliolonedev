<script>
  import { onMount } from 'svelte';
  import { getJson, putJson } from '$lib/api';

  let loading = true;
  let saving = false;
  let error = '';
  let saveInfo = '';

  let hero = {
    badgeText: '',
    title: '',
    description: '',
    primaryButtonLabel: '',
    primaryButtonHref: '',
    secondaryButtonLabel: '',
    secondaryButtonHref: '',
    adminButtonLabel: '',
    adminButtonHref: ''
  };

  async function loadHero() {
    loading = true;
    error = '';
    saveInfo = '';

    try {
      const data = await getJson('/api/site/hero');
      hero = {
        badgeText: data.hero?.badgeText || '',
        title: data.hero?.title || '',
        description: data.hero?.description || '',
        primaryButtonLabel: data.hero?.primaryButtonLabel || '',
        primaryButtonHref: data.hero?.primaryButtonHref || '',
        secondaryButtonLabel: data.hero?.secondaryButtonLabel || '',
        secondaryButtonHref: data.hero?.secondaryButtonHref || '',
        adminButtonLabel: data.hero?.adminButtonLabel || '',
        adminButtonHref: data.hero?.adminButtonHref || ''
      };
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function saveHero() {
    saving = true;
    error = '';
    saveInfo = '';

    try {
      if (!hero.title.trim()) {
        throw new Error('Judul hero wajib diisi');
      }

      await putJson('/api/site/hero', hero);
      await loadHero();
      saveInfo = 'Hero section berhasil disimpan dan diterapkan ke homepage.';
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  onMount(loadHero);
</script>

<div class="toolbar">
  <div>
    <p class="toolbar-kicker">Homepage Hero</p>
    <h1>Hero Section</h1>
    <p class="toolbar-sub">Edit badge, judul, deskripsi, dan tombol CTA pada hero homepage.</p>
  </div>
  <button class="button-outline" on:click={loadHero}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

{#if saveInfo}
  <div class="notice-success" style="margin-bottom:1rem;">{saveInfo}</div>
{/if}

<section class="panel">
  {#if loading}
    <p>Loading hero section...</p>
  {:else}
    <div class="form-grid">
      <label>
        Badge Text
        <input bind:value={hero.badgeText} placeholder="Web Services Portfolio" />
      </label>

      <label style="grid-column: 1 / -1;">
        Judul Hero
        <input bind:value={hero.title} placeholder="Bangun Website Jasa yang Modern..." />
      </label>

      <label style="grid-column: 1 / -1;">
        Deskripsi
        <textarea bind:value={hero.description}></textarea>
      </label>

      <label>
        Tombol Utama Label
        <input bind:value={hero.primaryButtonLabel} placeholder="Lihat Pricing" />
      </label>
      <label>
        Tombol Utama URL
        <input bind:value={hero.primaryButtonHref} placeholder="/pricing" />
      </label>

      <label>
        Tombol Kedua Label
        <input bind:value={hero.secondaryButtonLabel} placeholder="Baca Blog" />
      </label>
      <label>
        Tombol Kedua URL
        <input bind:value={hero.secondaryButtonHref} placeholder="/blog" />
      </label>

      <label>
        Tombol Admin Label
        <input bind:value={hero.adminButtonLabel} placeholder="Masuk Admin" />
      </label>
      <label>
        Tombol Admin URL
        <input bind:value={hero.adminButtonHref} placeholder="/admin" />
      </label>
    </div>

    <div class="button-row" style="margin-top:0.8rem;">
      <button class="button-main" on:click={saveHero} disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan Hero Section'}
      </button>
    </div>
  {/if}
</section>
