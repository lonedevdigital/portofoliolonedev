<script>
  import { onMount } from 'svelte';
  import { uploadImageFile } from '$lib/api';

  export let value = '';
  export let placeholder = 'Tulis konten...';
  export let minHeight = 220;

  let sourceMode = false;
  let editorElement;
  let uploadInput;
  let uploading = false;
  let uploadInfo = '';

  function syncFromEditor() {
    value = editorElement?.innerHTML || '';
  }

  function ensureFocus() {
    editorElement?.focus();
  }

  function exec(command, argument = null) {
    if (!editorElement) {
      return;
    }

    ensureFocus();
    document.execCommand(command, false, argument);
    syncFromEditor();
  }

  function formatBlock(tagName) {
    exec('formatBlock', `<${tagName}>`);
  }

  function insertLink() {
    const url = window.prompt('Masukkan URL link', 'https://');
    if (!url || !url.trim()) {
      return;
    }

    exec('createLink', url.trim());
  }

  function insertImageByUrl() {
    const url = window.prompt('Masukkan URL gambar', 'https://');
    if (!url || !url.trim()) {
      return;
    }

    exec('insertImage', url.trim());
  }

  async function uploadAndInsertImage(file) {
    if (!file || !String(file.type || '').toLowerCase().startsWith('image/')) {
      return;
    }

    uploading = true;
    uploadInfo = '';

    try {
      const uploaded = await uploadImageFile(file);
      const imageUrl = String(uploaded?.url || '').trim();
      if (!imageUrl) {
        throw new Error('Upload gambar gagal');
      }

      if (sourceMode) {
        const alt = String(file.name || 'image').replace(/"/g, '&quot;');
        value = `${value || ''}<p><img src="${imageUrl}" alt="${alt}" /></p>`;
      } else {
        ensureFocus();
        document.execCommand('insertImage', false, imageUrl);
        syncFromEditor();
      }

      uploadInfo = 'Gambar berhasil diupload.';
    } catch (error) {
      uploadInfo = error?.message || 'Gagal upload gambar';
    } finally {
      uploading = false;
      if (uploadInput) {
        uploadInput.value = '';
      }
    }
  }

  function openImagePicker() {
    uploadInput?.click();
  }

  async function handleImagePick(event) {
    const file = event.currentTarget.files?.[0] || null;
    if (!file) {
      return;
    }

    await uploadAndInsertImage(file);
  }

  async function handlePaste(event) {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => String(item.type || '').startsWith('image/'));
    if (!imageItem) {
      return;
    }

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }

    await uploadAndInsertImage(file);
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer?.files || []).find((item) =>
      String(item.type || '').startsWith('image/')
    );

    if (!file) {
      return;
    }

    await uploadAndInsertImage(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function toggleSourceMode() {
    if (sourceMode) {
      sourceMode = false;
      if (editorElement) {
        editorElement.innerHTML = value || '';
      }
      return;
    }

    syncFromEditor();
    sourceMode = true;
  }

  function handleSourceInput(event) {
    value = event.currentTarget.value;
  }

  onMount(() => {
    if (editorElement) {
      editorElement.innerHTML = value || '';
    }
  });

  $: if (!sourceMode && editorElement && editorElement.innerHTML !== (value || '')) {
    editorElement.innerHTML = value || '';
  }
</script>

<div class="editor-shell">
  <div class="editor-toolbar">
    <button type="button" on:click={() => formatBlock('p')}>P</button>
    <button type="button" on:click={() => formatBlock('h2')}>H2</button>
    <button type="button" on:click={() => formatBlock('h3')}>H3</button>
    <button type="button" on:click={() => exec('bold')}>Bold</button>
    <button type="button" on:click={() => exec('italic')}>Italic</button>
    <button type="button" on:click={() => exec('underline')}>Underline</button>
    <button type="button" on:click={() => exec('strikeThrough')}>Strike</button>
    <button type="button" on:click={() => exec('insertUnorderedList')}>UL</button>
    <button type="button" on:click={() => exec('insertOrderedList')}>OL</button>
    <button type="button" on:click={() => formatBlock('blockquote')}>Quote</button>
    <button type="button" on:click={() => formatBlock('pre')}>Code</button>
    <button type="button" on:click={insertLink}>Link</button>
    <button type="button" on:click={insertImageByUrl}>URL Img</button>
    <button type="button" on:click={openImagePicker} disabled={uploading}>
      {uploading ? 'Uploading...' : 'Upload Img'}
    </button>
    <button type="button" on:click={() => exec('insertHorizontalRule')}>HR</button>
    <button type="button" on:click={() => exec('removeFormat')}>Clear</button>
    <button type="button" class:active={sourceMode} on:click={toggleSourceMode}>HTML</button>
  </div>

  <input
    bind:this={uploadInput}
    class="editor-upload-input"
    type="file"
    accept="image/*"
    on:change={handleImagePick}
  />

  {#if sourceMode}
    <textarea
      class="editor-source"
      style={`min-height:${minHeight}px;`}
      value={value}
      on:input={handleSourceInput}
    ></textarea>
  {:else}
    <div
      bind:this={editorElement}
      class="editor-canvas"
      style={`min-height:${minHeight}px;`}
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      tabindex="0"
      data-placeholder={placeholder}
      on:input={syncFromEditor}
      on:paste={handlePaste}
      on:drop={handleDrop}
      on:dragover={handleDragOver}
    ></div>
  {/if}

  <p class="editor-help">
    Ctrl+V untuk paste gambar langsung, atau klik Upload Img.
  </p>

  {#if uploadInfo}
    <p class="editor-status">{uploadInfo}</p>
  {/if}
</div>
