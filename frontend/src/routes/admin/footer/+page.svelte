<script>
  import { onMount } from 'svelte';
  import { getJson, putJson } from '$lib/api';

  let loading = true;
  let saving = false;
  let error = '';

  let footer = {
    aboutText: '',
    contactEmail: '',
    whatsapp: '',
    address: '',
    socials: [],
    copyrightText: ''
  };

  function addSocial() {
    footer = {
      ...footer,
      socials: [...(footer.socials || []), { label: '', url: '' }]
    };
  }

  function removeSocial(index) {
    footer = {
      ...footer,
      socials: footer.socials.filter((_, itemIndex) => itemIndex !== index)
    };
  }

  async function loadFooter() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/site/footer');
      footer = {
        aboutText: data.footer?.aboutText || '',
        contactEmail: data.footer?.contactEmail || '',
        whatsapp: data.footer?.whatsapp || '',
        address: data.footer?.address || '',
        socials: data.footer?.socials || [],
        copyrightText: data.footer?.copyrightText || ''
      };
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function saveFooter() {
    saving = true;
    error = '';

    try {
      await putJson('/api/site/footer', footer);
      await loadFooter();
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  onMount(loadFooter);
</script>

<div class="toolbar">
  <div>
    <h1 style="margin:0;">Footer</h1>
    <p style="margin:0.2rem 0 0; color:#64748b;">Atur info footer dan social links.</p>
  </div>
  <button class="button-outline" on:click={loadFooter}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  {#if loading}
    <p>Loading footer...</p>
  {:else}
    <div class="form-grid">
      <label style="grid-column:1 / -1;">
        About Text
        <textarea bind:value={footer.aboutText}></textarea>
      </label>
      <label>
        Contact Email
        <input bind:value={footer.contactEmail} placeholder="hello@domain.com" />
      </label>
      <label>
        WhatsApp
        <input bind:value={footer.whatsapp} placeholder="+62..." />
      </label>
      <label>
        Address
        <input bind:value={footer.address} placeholder="Jakarta, Indonesia" />
      </label>
      <label>
        Copyright
        <input bind:value={footer.copyrightText} placeholder="Copyright 2026 ..." />
      </label>
    </div>

    <h3>Social Links</h3>
    {#each footer.socials as social, index}
      <div class="form-grid" style="margin-bottom:0.6rem;">
        <label>
          Label
          <input bind:value={social.label} placeholder="LinkedIn" />
        </label>
        <label>
          URL
          <input bind:value={social.url} placeholder="https://..." />
        </label>
        <div style="display:flex; align-items:flex-end;">
          <button class="button-alt" on:click={() => removeSocial(index)}>Hapus</button>
        </div>
      </div>
    {/each}

    <div class="button-row" style="margin-top:0.8rem;">
      <button class="button-outline" on:click={addSocial}>Tambah Social</button>
      <button class="button-main" on:click={saveFooter} disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan Footer'}
      </button>
    </div>
  {/if}
</section>
