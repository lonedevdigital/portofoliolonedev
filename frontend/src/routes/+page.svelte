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
  let hero = {
    badgeText: 'Web Services Portfolio',
    title: 'Bangun Website Jasa yang Modern, Cepat, dan Mudah Dikelola',
    description:
      'Tampilkan portfolio project, publish artikel blog, atur pricing produk, dan kelola semuanya lewat admin dashboard yang sederhana.',
    primaryButtonLabel: 'Lihat Pricing',
    primaryButtonHref: '/pricing',
    secondaryButtonLabel: 'Baca Blog',
    secondaryButtonHref: '/blog',
    adminButtonLabel: 'Masuk Admin',
    adminButtonHref: '/admin'
  };
  let products = [];
  let latestPosts = [];
  let clients = [];

  function stripHtml(input) {
    return String(input || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function summarize(input, max = 140) {
    const text = stripHtml(input);
    if (text.length <= max) {
      return text;
    }

    return `${text.slice(0, max)}...`;
  }

  async function loadHome() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/public/home');
      navigation = data.navigation;
      footer = data.footer;
      style = data.style;
      hero = data.hero || hero;
      products = data.products || [];
      latestPosts = data.latestPosts || [];
      clients = data.clients || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadHome();
    postJson('/api/visits', { path: '/' }).catch(() => {});
  });
</script>

<svelte:head>
  <title>Portfolio Web Services | LoneDev</title>
</svelte:head>

{#if loading}
  <div class="container" style="padding: 2rem 0;">Loading...</div>
{:else if error}
  <div class="container" style="padding: 2rem 0;">
    <div class="notice">Gagal memuat data: {error}</div>
  </div>
{:else}
  <SiteFrame {navigation} {footer} {style}>
    <section class="page-section" style="background: var(--hero-bg); color: var(--hero-text);">
      <div class="container hero-panel" style="background: var(--hero-bg); color: var(--hero-text);">
        <span class="badge">{hero.badgeText}</span>
        <h1 class="hero-title">{hero.title}</h1>
        <p class="hero-desc">{hero.description}</p>
        <div class="button-row">
          {#if hero.primaryButtonLabel && hero.primaryButtonHref}
            <a class="button-main" href={hero.primaryButtonHref}>{hero.primaryButtonLabel}</a>
          {/if}
          {#if hero.secondaryButtonLabel && hero.secondaryButtonHref}
            <a class="button-alt" href={hero.secondaryButtonHref}>{hero.secondaryButtonLabel}</a>
          {/if}
          {#if hero.adminButtonLabel && hero.adminButtonHref}
            <a class="button-outline" href={hero.adminButtonHref}>{hero.adminButtonLabel}</a>
          {/if}
        </div>
      </div>
    </section>

    <section class="page-section" style="background: var(--product-bg); color: var(--product-text);">
      <div class="container">
        <h2 class="section-title">Produk & Services</h2>
        <p class="section-subtitle">Paket layanan yang siap dijual lengkap dengan detail dan harga.</p>
        <div class="card-grid">
          {#each products as product}
            <article class="flat-card">
              {#if product.imageUrl}
                <img class="media-thumb" src={product.imageUrl} alt={product.name} loading="lazy" />
              {/if}
              <span class="badge">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.shortDescription}</p>
              <p class="price-tag">{product.currency} {Number(product.price).toLocaleString()}</p>
              <div class="richtext">{@html product.detail}</div>
            </article>
          {/each}
        </div>
      </div>
    </section>

    <section class="page-section" style="background: var(--blog-bg); color: var(--blog-text);">
      <div class="container">
        <h2 class="section-title">Blog Terbaru</h2>
        <p class="section-subtitle">Konten edukasi untuk meningkatkan trust calon klien.</p>
        <div class="card-grid">
          {#if latestPosts.length}
            {#each latestPosts as post}
              <article class="flat-card">
                {#if post.coverUrl}
                  <img class="media-thumb" src={post.coverUrl} alt={post.title} loading="lazy" />
                {/if}
                <span class="badge">{post.categoryName || 'Uncategorized'}</span>
                <h3>{post.title}</h3>
                <p class="blog-meta">{new Date(post.createdAt).toLocaleDateString('id-ID')}</p>
                <p>{post.excerpt || summarize(post.content)}</p>
                <a class="button-outline" href={`/blog/${post.slug}`}>Baca Detail</a>
              </article>
            {/each}
          {:else}
            <p class="empty">Belum ada artikel yang dipublikasikan.</p>
          {/if}
        </div>
      </div>
    </section>

    <section class="page-section" style="background: var(--pricing-bg); color: var(--pricing-text);">
      <div class="container">
        <h2 class="section-title">Pricing Plan</h2>
        <p class="section-subtitle">Gunakan list ini sebagai pricing table untuk penawaran services Anda.</p>
        <div class="card-grid">
          {#each products as product}
            <article class="flat-card">
              {#if product.imageUrl}
                <img class="media-thumb" src={product.imageUrl} alt={product.name} loading="lazy" />
              {/if}
              <h3>{product.name}</h3>
              <p class="price-tag">{product.currency} {Number(product.price).toLocaleString()}</p>
              <p>{product.shortDescription}</p>
              <div class="richtext">{@html product.detail}</div>
              <a class="button-main" href="/pricing">Lihat Paket</a>
            </article>
          {/each}
        </div>
      </div>
    </section>

    <section class="page-section" style="background: var(--clients-bg); color: var(--clients-text);">
      <div class="container">
        <h2 class="section-title">Client Experience</h2>
        <p class="section-subtitle">Tampilkan bukti sosial untuk meningkatkan kredibilitas.</p>
        <div class="card-grid">
          {#if clients.length}
            {#each clients as client}
              <article class="flat-card">
                <h3>{client.name}</h3>
                <p>{client.testimonial || 'Belum ada testimonial.'}</p>
                {#if client.website}
                  <a class="button-outline" href={client.website} target="_blank" rel="noreferrer">Website</a>
                {/if}
              </article>
            {/each}
          {:else}
            <p class="empty">Belum ada data client.</p>
          {/if}
        </div>
      </div>
    </section>
  </SiteFrame>
{/if}
