<script>
  import { onMount } from 'svelte';
  import { getJson, putJson } from '$lib/api';

  let loading = true;
  let saving = false;
  let error = '';
  let items = [];

  function addItem() {
    items = [...items, { label: '', href: '' }];
  }

  function removeItem(index) {
    items = items.filter((_, itemIndex) => itemIndex !== index);
  }

  async function loadNavigation() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/site/navigation');
      items = data.navigation?.items || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function saveNavigation() {
    saving = true;
    error = '';

    try {
      await putJson('/api/site/navigation', {
        items
      });
      await loadNavigation();
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  onMount(loadNavigation);
</script>

<div class="toolbar">
  <div>
    <p class="toolbar-kicker">Header Menu</p>
    <h1>Navigation</h1>
    <p class="toolbar-sub">Atur menu header website.</p>
  </div>
  <button class="button-outline" on:click={loadNavigation}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  <h2 style="margin-top:0;">Item Menu</h2>

  {#if loading}
    <p>Loading navigation...</p>
  {:else}
    {#if !items.length}
      <p class="empty">Belum ada menu.</p>
    {/if}

    {#each items as item, index}
      <div class="form-grid" style="margin-bottom:0.6rem;">
        <label>
          Label
          <input bind:value={item.label} placeholder="Home" />
        </label>
        <label>
          URL / Path
          <input bind:value={item.href} placeholder="/pricing" />
        </label>
        <div style="display:flex; align-items:flex-end;">
          <button class="button-danger" on:click={() => removeItem(index)}>Hapus</button>
        </div>
      </div>
    {/each}

    <div class="button-row" style="margin-top:0.8rem;">
      <button class="button-outline" on:click={addItem}>Tambah Item</button>
      <button class="button-main" on:click={saveNavigation} disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan Perubahan Navigasi'}
      </button>
    </div>
  {/if}
</section>
