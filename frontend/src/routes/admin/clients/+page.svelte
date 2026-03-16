<script>
  import { onMount } from 'svelte';
  import { deleteJson, getJson, postJson, putJson } from '$lib/api';

  let loading = true;
  let saving = false;
  let error = '';
  let clients = [];
  let editId = null;

  let form = {
    name: '',
    logoUrl: '',
    website: '',
    testimonial: ''
  };

  function resetForm() {
    editId = null;
    form = {
      name: '',
      logoUrl: '',
      website: '',
      testimonial: ''
    };
  }

  async function loadClients() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/clients');
      clients = data.clients || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function editClient(client) {
    editId = client.id;
    form = {
      name: client.name,
      logoUrl: client.logoUrl || '',
      website: client.website || '',
      testimonial: client.testimonial || ''
    };
  }

  async function submitClient() {
    saving = true;

    try {
      if (!form.name.trim()) {
        throw new Error('Nama client wajib diisi');
      }

      if (editId) {
        await putJson(`/api/clients/${editId}`, form);
      } else {
        await postJson('/api/clients', form);
      }

      await loadClients();
      resetForm();
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  async function removeClient(id) {
    if (!confirm('Hapus data client ini?')) {
      return;
    }

    try {
      await deleteJson(`/api/clients/${id}`);
      await loadClients();
      if (editId === id) {
        resetForm();
      }
    } catch (err) {
      error = err.message;
    }
  }

  onMount(loadClients);
</script>

<div class="toolbar">
  <div>
    <h1 style="margin:0;">Clients</h1>
    <p style="margin:0.2rem 0 0; color:#64748b;">Kelola daftar client dan testimonial.</p>
  </div>
  <button class="button-outline" on:click={loadClients}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  <h2 style="margin-top:0;">{editId ? 'Edit Client' : 'Tambah Client'}</h2>
  <div class="form-grid">
    <label>
      Nama Client
      <input bind:value={form.name} placeholder="Nama perusahaan/client" />
    </label>
    <label>
      Website
      <input bind:value={form.website} placeholder="https://..." />
    </label>
    <label>
      Logo URL
      <input bind:value={form.logoUrl} placeholder="https://..." />
    </label>
    <label style="grid-column: 1 / -1;">
      Testimonial
      <textarea bind:value={form.testimonial}></textarea>
    </label>
  </div>
  <div class="button-row" style="margin-top:0.8rem;">
    <button class="button-main" on:click={submitClient} disabled={saving}>
      {saving ? 'Menyimpan...' : editId ? 'Update Client' : 'Tambah Client'}
    </button>
    {#if editId}
      <button class="button-outline" on:click={resetForm}>Batal Edit</button>
      <button class="button-alt" on:click={() => removeClient(editId)}>Hapus Client Ini</button>
    {/if}
  </div>
</section>

<section class="panel">
  <h2 style="margin-top:0;">Daftar Clients</h2>
  {#if loading}
    <p>Loading clients...</p>
  {:else if !clients.length}
    <p class="empty">Belum ada client.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Website</th>
            <th>Testimonial</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each clients as client}
            <tr>
              <td>{client.name}</td>
              <td>
                {#if client.website}
                  <a href={client.website} target="_blank" rel="noreferrer">{client.website}</a>
                {:else}
                  -
                {/if}
              </td>
              <td>{client.testimonial || '-'}</td>
              <td>
                <div class="button-row">
                  <button class="button-outline" on:click={() => editClient(client)}>Edit</button>
                  <button class="button-alt" on:click={() => removeClient(client.id)}>Hapus</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
