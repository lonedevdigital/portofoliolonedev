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

  let categories = [];
  let posts = [];
  let selectedCategory = 'all';

  $: filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((item) => String(item.categoryId) === String(selectedCategory));

  async function loadData() {
    loading = true;
    error = '';

    try {
      const [home, blog] = await Promise.all([
        getJson('/api/public/home'),
        getJson('/api/public/blog')
      ]);

      navigation = home.navigation;
      footer = home.footer;
      style = home.style;

      categories = blog.categories || [];
      posts = blog.posts || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadData();
    postJson('/api/visits', { path: '/blog' }).catch(() => {});
  });
</script>

<svelte:head>
  <title>Blog | LoneDev</title>
</svelte:head>

{#if loading}
  <div class="container" style="padding: 2rem 0;">Loading...</div>
{:else if error}
  <div class="container" style="padding: 2rem 0;">
    <div class="notice">Gagal memuat data: {error}</div>
  </div>
{:else}
  <SiteFrame {navigation} {footer} {style}>
    <section class="page-section" style="background: var(--blog-bg); color: var(--blog-text);">
      <div class="container">
        <h1 class="section-title">Blog</h1>
        <p class="section-subtitle">
          Artikel edukasi dan update project. Kelola kategori dan posting dari admin.
        </p>

        <div class="panel" style="margin-bottom:1rem; background: var(--card-bg); border-color: var(--card-border);">
          <label>
            Filter Kategori
            <select bind:value={selectedCategory}>
              <option value="all">Semua</option>
              {#each categories as category}
                <option value={String(category.id)}>{category.name}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="card-grid">
          {#if filteredPosts.length}
            {#each filteredPosts as post}
              <article class="flat-card">
                <span class="badge">{post.categoryName || 'Uncategorized'}</span>
                <h3>{post.title}</h3>
                <p class="blog-meta">{new Date(post.createdAt).toLocaleDateString('id-ID')}</p>
                <p>{post.excerpt || post.content.slice(0, 120) + '...'}</p>
                <a class="button-main" href={`/blog/${post.slug}`}>Baca Selengkapnya</a>
              </article>
            {/each}
          {:else}
            <p class="empty">Belum ada posting untuk kategori ini.</p>
          {/if}
        </div>
      </div>
    </section>
  </SiteFrame>
{/if}
