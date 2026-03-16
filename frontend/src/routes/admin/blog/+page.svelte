<script>
  import { onMount } from 'svelte';
  import { deleteJson, getJson, postJson, putJson } from '$lib/api';

  let loading = true;
  let savingPost = false;
  let error = '';

  let categories = [];
  let posts = [];

  let categoryName = '';

  let editPostId = null;
  let postForm = {
    title: '',
    excerpt: '',
    content: '',
    categoryId: '',
    coverUrl: '',
    isPublished: true
  };

  function resetPostForm() {
    editPostId = null;
    postForm = {
      title: '',
      excerpt: '',
      content: '',
      categoryId: '',
      coverUrl: '',
      isPublished: true
    };
  }

  async function loadData() {
    loading = true;
    error = '';

    try {
      const [categoryData, postData] = await Promise.all([
        getJson('/api/blog/categories'),
        getJson('/api/blog/posts')
      ]);

      categories = categoryData.categories || [];
      posts = postData.posts || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function addCategory() {
    try {
      if (!categoryName.trim()) {
        throw new Error('Nama category wajib diisi');
      }

      await postJson('/api/blog/categories', { name: categoryName });
      categoryName = '';
      await loadData();
    } catch (err) {
      error = err.message;
    }
  }

  async function removeCategory(id) {
    if (!confirm('Hapus category ini? Post yang terkait akan menjadi uncategorized.')) {
      return;
    }

    try {
      await deleteJson(`/api/blog/categories/${id}`);
      await loadData();
    } catch (err) {
      error = err.message;
    }
  }

  function editPost(post) {
    editPostId = post.id;
    postForm = {
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      categoryId: post.categoryId ? String(post.categoryId) : '',
      coverUrl: post.coverUrl || '',
      isPublished: post.isPublished
    };
  }

  async function submitPost() {
    savingPost = true;

    try {
      if (!postForm.title.trim()) {
        throw new Error('Judul post wajib diisi');
      }

      if (!postForm.content.trim()) {
        throw new Error('Isi post wajib diisi');
      }

      const payload = {
        title: postForm.title,
        excerpt: postForm.excerpt,
        content: postForm.content,
        categoryId: postForm.categoryId || null,
        coverUrl: postForm.coverUrl,
        isPublished: postForm.isPublished
      };

      if (editPostId) {
        await putJson(`/api/blog/posts/${editPostId}`, payload);
      } else {
        await postJson('/api/blog/posts', payload);
      }

      resetPostForm();
      await loadData();
    } catch (err) {
      error = err.message;
    } finally {
      savingPost = false;
    }
  }

  async function removePost(id) {
    if (!confirm('Hapus post ini?')) {
      return;
    }

    try {
      await deleteJson(`/api/blog/posts/${id}`);
      await loadData();
      if (editPostId === id) {
        resetPostForm();
      }
    } catch (err) {
      error = err.message;
    }
  }

  onMount(loadData);
</script>

<div class="toolbar">
  <div>
    <h1 style="margin:0;">Blog</h1>
    <p style="margin:0.2rem 0 0; color:#64748b;">Tambah kategori, tulis post, publish/unpublish artikel.</p>
  </div>
  <button class="button-outline" on:click={loadData}>Reload</button>
</div>

{#if error}
  <div class="notice" style="margin-bottom:1rem;">{error}</div>
{/if}

<section class="panel">
  <h2 style="margin-top:0;">Category</h2>
  <div class="button-row">
    <input style="max-width:320px;" bind:value={categoryName} placeholder="Nama category" />
    <button class="button-main" on:click={addCategory}>Tambah Category</button>
  </div>

  <div class="table-wrap" style="margin-top:0.8rem;">
    <table>
      <thead>
        <tr>
          <th>Nama</th>
          <th>Slug</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#if categories.length}
          {#each categories as category}
            <tr>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>
                <button class="button-alt" on:click={() => removeCategory(category.id)}>Hapus</button>
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="3" class="empty">Belum ada category.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>

<section class="panel">
  <h2 style="margin-top:0;">{editPostId ? 'Edit Post' : 'Tambah Post'}</h2>
  <div class="form-grid">
    <label>
      Judul
      <input bind:value={postForm.title} placeholder="Judul artikel" />
    </label>
    <label>
      Category
      <select bind:value={postForm.categoryId}>
        <option value="">Uncategorized</option>
        {#each categories as category}
          <option value={String(category.id)}>{category.name}</option>
        {/each}
      </select>
    </label>
    <label style="grid-column: 1 / -1;">
      Excerpt
      <textarea bind:value={postForm.excerpt}></textarea>
    </label>
    <label style="grid-column: 1 / -1;">
      Content
      <textarea bind:value={postForm.content}></textarea>
    </label>
    <label>
      Cover URL
      <input bind:value={postForm.coverUrl} placeholder="https://..." />
    </label>
    <label style="align-items:flex-start;">
      <span>Published</span>
      <input type="checkbox" bind:checked={postForm.isPublished} />
    </label>
  </div>

  <div class="button-row" style="margin-top:0.8rem;">
    <button class="button-main" on:click={submitPost} disabled={savingPost}>
      {savingPost ? 'Menyimpan...' : editPostId ? 'Update Post' : 'Tambah Post'}
    </button>
    {#if editPostId}
      <button class="button-outline" on:click={resetPostForm}>Batal Edit</button>
    {/if}
  </div>
</section>

<section class="panel">
  <h2 style="margin-top:0;">Daftar Post</h2>
  {#if loading}
    <p>Loading post...</p>
  {:else if !posts.length}
    <p class="empty">Belum ada post.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Judul</th>
            <th>Category</th>
            <th>Status</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each posts as post}
            <tr>
              <td>{post.title}</td>
              <td>{post.categoryName || 'Uncategorized'}</td>
              <td>{post.isPublished ? 'Published' : 'Draft'}</td>
              <td>{new Date(post.createdAt).toLocaleDateString('id-ID')}</td>
              <td>
                <div class="button-row">
                  <button class="button-outline" on:click={() => editPost(post)}>Edit</button>
                  <button class="button-alt" on:click={() => removePost(post.id)}>Hapus</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
