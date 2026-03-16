<script>
  import { onMount } from 'svelte';
  import { deleteJson, getJson, postJson, putJson, uploadImageFile } from '$lib/api';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';

  let loading = true;
  let savingPost = false;
  let savingCategory = false;
  let uploadingCover = false;
  let error = '';

  let categories = [];
  let posts = [];

  let categoryName = '';

  let editPostId = null;
  let coverInput;
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

  function hasRichContent(html) {
    const textOnly = String(html || '').replace(/<[^>]*>/g, '').trim();
    return Boolean(textOnly) || /<img\b/i.test(String(html || ''));
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
    savingCategory = true;
    try {
      if (!categoryName.trim()) {
        throw new Error('Nama category wajib diisi');
      }

      await postJson('/api/blog/categories', { name: categoryName });
      categoryName = '';
      await loadData();
    } catch (err) {
      error = err.message;
    } finally {
      savingCategory = false;
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

      if (!hasRichContent(postForm.content)) {
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

  async function uploadCoverImage(file) {
    if (!file) {
      return;
    }

    uploadingCover = true;
    error = '';

    try {
      const uploaded = await uploadImageFile(file);
      const coverUrl = String(uploaded?.url || '').trim();
      if (!coverUrl) {
        throw new Error('Upload gambar cover gagal');
      }

      postForm = {
        ...postForm,
        coverUrl
      };
    } catch (err) {
      error = err.message;
    } finally {
      uploadingCover = false;
      if (coverInput) {
        coverInput.value = '';
      }
    }
  }

  function triggerCoverPicker() {
    coverInput?.click();
  }

  async function handleCoverPick(event) {
    const file = event.currentTarget.files?.[0] || null;
    await uploadCoverImage(file);
  }

  async function handleCoverPaste(event) {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => String(item.type || '').startsWith('image/'));
    if (!imageItem) {
      return;
    }

    event.preventDefault();
    await uploadCoverImage(imageItem.getAsFile());
  }

  onMount(loadData);
</script>

<div class="toolbar">
  <div>
    <p class="toolbar-kicker">Content Manager</p>
    <h1>Blog</h1>
    <p class="toolbar-sub">Tambah kategori, tulis post rich text, paste gambar langsung, publish/unpublish artikel.</p>
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
    <button class="button-main" on:click={addCategory} disabled={savingCategory}>
      {savingCategory ? 'Menyimpan...' : 'Simpan Category'}
    </button>
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
                <button class="button-danger" on:click={() => removeCategory(category.id)}>Hapus</button>
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
    <label style="grid-column: 1 / -1;" on:paste={handleCoverPaste}>
      Cover URL (bisa Ctrl+V gambar langsung)
      <input bind:value={postForm.coverUrl} placeholder="https://..." />
      <input
        bind:this={coverInput}
        class="editor-upload-input"
        type="file"
        accept="image/*"
        on:change={handleCoverPick}
      />
      <div class="button-row" style="margin-top:0.45rem;">
        <button class="button-outline" type="button" on:click={triggerCoverPicker} disabled={uploadingCover}>
          {uploadingCover ? 'Uploading...' : 'Upload Gambar Cover'}
        </button>
      </div>
    </label>
    <label style="align-items:flex-start;">
      <span>Published</span>
      <input type="checkbox" bind:checked={postForm.isPublished} />
    </label>
    <label style="grid-column: 1 / -1;">
      Excerpt
      <textarea bind:value={postForm.excerpt}></textarea>
    </label>
    <label style="grid-column: 1 / -1;">
      Content (Rich Text)
      <RichTextEditor bind:value={postForm.content} placeholder="Tulis konten artikel seperti editor WordPress..." minHeight={280} />
    </label>
  </div>

  {#if postForm.coverUrl}
    <div style="margin-top:0.8rem;">
      <img class="cover-image" src={postForm.coverUrl} alt="Preview Cover" loading="lazy" />
    </div>
  {/if}

  <div class="button-row" style="margin-top:0.8rem;">
    <button class="button-main" on:click={submitPost} disabled={savingPost}>
      {savingPost ? 'Menyimpan...' : 'Simpan Post'}
    </button>
    {#if editPostId}
      <button class="button-outline" on:click={resetPostForm}>Batal Edit</button>
      <button class="button-danger" on:click={() => removePost(editPostId)}>Hapus Post Ini</button>
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
            <th>Cover</th>
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
              <td>
                {#if post.coverUrl}
                  <img class="table-thumb" src={post.coverUrl} alt={post.title} loading="lazy" />
                {:else}
                  -
                {/if}
              </td>
              <td>{post.categoryName || 'Uncategorized'}</td>
              <td>{post.isPublished ? 'Published' : 'Draft'}</td>
              <td>{new Date(post.createdAt).toLocaleDateString('id-ID')}</td>
              <td>
                <div class="button-row">
                  <button class="button-outline" on:click={() => editPost(post)}>Edit</button>
                  <button class="button-danger" on:click={() => removePost(post.id)}>Hapus</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
