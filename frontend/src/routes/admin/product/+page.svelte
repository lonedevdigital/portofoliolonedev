<script>
  import { onMount } from 'svelte';
  import { deleteJson, getJson, postJson, putJson } from '$lib/api';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';

  let loading = true;
  let saving = false;
  let error = '';
  let products = [];
  let editId = null;

  let form = {
    name: '',
    category: 'Website',
    imageUrl: '',
    shortDescription: '',
    detail: '',
    price: 0,
    currency: 'USD',
    isFeatured: false
  };

  function resetForm() {
    editId = null;
    form = {
      name: '',
      category: 'Website',
      imageUrl: '',
      shortDescription: '',
      detail: '',
      price: 0,
      currency: 'USD',
      isFeatured: false
    };
  }

  async function loadProducts() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/products');
      products = data.products || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function editProduct(product) {
    editId = product.id;
    form = {
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl || '',
      shortDescription: product.shortDescription,
      detail: product.detail,
      price: product.price,
      currency: product.currency,
      isFeatured: product.isFeatured
    };
  }

  async function submitProduct() {
    saving = true;
    error = '';

    try {
      if (!form.name.trim()) {
        throw new Error('Nama product wajib diisi');
      }

      const payload = {
        name: form.name,
        category: form.category,
        imageUrl: form.imageUrl,
        shortDescription: form.shortDescription,
        detail: form.detail,
        price: Number(form.price) || 0,
        currency: form.currency || 'USD',
        isFeatured: form.isFeatured
      };

      if (editId) {
        await putJson(`/api/products/${editId}`, payload);
      } else {
        await postJson('/api/products', payload);
      }

      await loadProducts();
      resetForm();
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  async function removeProduct(id) {
    if (!confirm('Hapus product ini?')) {
      return;
    }

    try {
      await deleteJson(`/api/products/${id}`);
      await loadProducts();
      if (editId === id) {
        resetForm();
      }
    } catch (err) {
      error = err.message;
    }
  }

  onMount(loadProducts);
</script>

<div class="toolbar">
  <div>
    <p class="toolbar-kicker">Catalog Manager</p>
    <h1>Product</h1>
    <p class="toolbar-sub">Kelola layanan, detail, harga, gambar, dan konten rich text.</p>
  </div>
  <button class="button-outline" on:click={loadProducts}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  <h2 style="margin-top:0;">{editId ? 'Edit Product' : 'Tambah Product'}</h2>
  <div class="form-grid">
    <label>
      Nama Product
      <input bind:value={form.name} placeholder="Contoh: Landing Page Pro" />
    </label>
    <label>
      Category
      <input bind:value={form.category} placeholder="Website / Automation" />
    </label>
    <label>
      Image URL
      <input bind:value={form.imageUrl} placeholder="https://..." />
    </label>
    <label>
      Harga
      <input type="number" min="0" bind:value={form.price} />
    </label>
    <label>
      Mata Uang
      <input bind:value={form.currency} placeholder="USD / IDR" />
    </label>
    <label style="grid-column: 1 / -1;">
      Short Description
      <textarea bind:value={form.shortDescription}></textarea>
    </label>
    <label style="grid-column: 1 / -1;">
      Detail Product (Rich Text)
      <RichTextEditor bind:value={form.detail} placeholder="Tulis detail product dengan rich text..." minHeight={220} />
    </label>
    <label style="align-items:flex-start;">
      <span>Featured Product</span>
      <input type="checkbox" bind:checked={form.isFeatured} />
    </label>
  </div>
  <div class="button-row" style="margin-top:0.8rem;">
    <button class="button-main" on:click={submitProduct} disabled={saving}>
      {saving ? 'Menyimpan...' : 'Simpan Product'}
    </button>
    {#if editId}
      <button class="button-outline" on:click={resetForm}>Batal Edit</button>
      <button class="button-danger" on:click={() => removeProduct(editId)}>Hapus Product Ini</button>
    {/if}
  </div>
</section>

<section class="panel">
  <h2 style="margin-top:0;">Daftar Product</h2>
  {#if loading}
    <p>Loading product...</p>
  {:else if !products.length}
    <p class="empty">Belum ada product.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Gambar</th>
            <th>Category</th>
            <th>Harga</th>
            <th>Featured</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product}
            <tr>
              <td>
                <strong>{product.name}</strong>
                <div style="font-size:0.82rem; color:#64748b;">{product.shortDescription}</div>
              </td>
              <td>
                {#if product.imageUrl}
                  <img class="table-thumb" src={product.imageUrl} alt={product.name} loading="lazy" />
                {:else}
                  -
                {/if}
              </td>
              <td>{product.category}</td>
              <td>{product.currency} {Number(product.price).toLocaleString()}</td>
              <td>{product.isFeatured ? 'Ya' : 'Tidak'}</td>
              <td>
                <div class="button-row">
                  <button class="button-outline" on:click={() => editProduct(product)}>Edit</button>
                  <button class="button-danger" on:click={() => removeProduct(product.id)}>Hapus</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
