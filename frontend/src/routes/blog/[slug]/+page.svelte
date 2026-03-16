<script>
  import { page } from '$app/stores';
  import SiteFrame from '$lib/components/SiteFrame.svelte';
  import { getJson, postJson } from '$lib/api';

  let loading = true;
  let error = '';
  let initializedSlug = '';

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

  let post = null;

  async function loadData(slug) {
    loading = true;
    error = '';

    try {
      const [home, postData] = await Promise.all([
        getJson('/api/public/home'),
        getJson(`/api/public/blog/${slug}`)
      ]);

      navigation = home.navigation;
      footer = home.footer;
      style = home.style;
      post = postData.post;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  $: if ($page.params.slug && $page.params.slug !== initializedSlug) {
    initializedSlug = $page.params.slug;
    loadData(initializedSlug);
    postJson('/api/visits', { path: `/blog/${initializedSlug}` }).catch(() => {});
  }
</script>

<svelte:head>
  <title>{post ? `${post.title} | Blog` : 'Blog Detail'}</title>
</svelte:head>

{#if loading}
  <div class="container" style="padding: 2rem 0;">Loading...</div>
{:else if error}
  <div class="container" style="padding: 2rem 0;">
    <div class="notice">Gagal memuat data: {error}</div>
  </div>
{:else}
  <SiteFrame {navigation} {footer} {style}>
    <article class="page-section" style="background: var(--blog-bg); color: var(--blog-text);">
      <div class="container">
        <a class="button-outline" href="/blog" style="margin-bottom:1rem; display:inline-flex;">Kembali ke Blog</a>
        <div class="panel" style="background: var(--card-bg); border-color: var(--card-border);">
          <span class="badge">{post.categoryName || 'Uncategorized'}</span>
          <h1 class="section-title" style="margin-top:0.6rem;">{post.title}</h1>
          <p class="blog-meta">{new Date(post.createdAt).toLocaleDateString('id-ID')}</p>
          {#if post.excerpt}
            <p><strong>{post.excerpt}</strong></p>
          {/if}
          <p style="white-space: pre-wrap;">{post.content}</p>
        </div>
      </div>
    </article>
  </SiteFrame>
{/if}
