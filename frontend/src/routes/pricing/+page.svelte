<script>
  import { onMount } from 'svelte';
  import SiteFrame from '$lib/components/SiteFrame.svelte';
  import { getJson, postJson } from '$lib/api';

  let loading = true;
  let error = '';
  let navigation = { items: [] };
  let footer = {
    aboutText: '',
    contactEmail: '',
    whatsapp: '',
    address: '',
    socials: [],
    copyrightText: ''
  };
  let style = { colors: {} };
  let products = [];

  async function loadData() {
    loading = true;
    error = '';

    try {
      const [home, productData] = await Promise.all([
        getJson('/api/public/home'),
        getJson('/api/public/products')
      ]);
      navigation = home.navigation;
      footer = home.footer;
      style = home.style;
      products = productData.products || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadData();
    postJson('/api/visits', { path: '/pricing' }).catch(() => {});
  });
</script>

<svelte:head>
  <title>Pricing | LoneDev</title>
</svelte:head>

{#if loading}
  <div class="container" style="padding: 2rem 0;">Loading...</div>
{:else if error}
  <div class="container" style="padding: 2rem 0;">
    <div class="notice">Gagal memuat data: {error}</div>
  </div>
{:else}
  <SiteFrame {navigation} {footer} {style}>
    <section class="page-section" style="background: var(--pricing-bg); color: var(--pricing-text);">
      <div class="container">
        <h1 class="section-title">Pricing Services</h1>
        <p class="section-subtitle">
          Kelola paket dan harga dari admin dashboard lalu tampilkan otomatis di halaman ini.
        </p>
        <div class="card-grid">
          {#if products.length}
            {#each products as product}
              <article class="flat-card">
                {#if product.imageUrl}
                  <img class="media-thumb" src={product.imageUrl} alt={product.name} loading="lazy" />
                {/if}
                <span class="badge">{product.category}</span>
                <h3>{product.name}</h3>
                <p class="price-tag">{product.currency} {Number(product.price).toLocaleString()}</p>
                <p>{product.shortDescription}</p>
                <div class="richtext">{@html product.detail}</div>
                <a class="button-main" href={`mailto:${footer.contactEmail}`}>Ambil Paket</a>
              </article>
            {/each}
          {:else}
            <p class="empty">Belum ada produk. Tambahkan dari menu admin Product.</p>
          {/if}
        </div>
      </div>
    </section>
  </SiteFrame>
{/if}
