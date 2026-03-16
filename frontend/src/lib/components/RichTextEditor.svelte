<script>
  import { onMount } from 'svelte';

  export let value = '';
  export let placeholder = 'Tulis konten...';
  export let minHeight = 220;

  let sourceMode = false;
  let editorElement;

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

  function insertImage() {
    const url = window.prompt('Masukkan URL gambar', 'https://');
    if (!url || !url.trim()) {
      return;
    }

    exec('insertImage', url.trim());
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
    <button type="button" on:click={insertImage}>Image</button>
    <button type="button" on:click={() => exec('insertHorizontalRule')}>HR</button>
    <button type="button" on:click={() => exec('removeFormat')}>Clear</button>
    <button type="button" class:active={sourceMode} on:click={toggleSourceMode}>HTML</button>
  </div>

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
      data-placeholder={placeholder}
      on:input={syncFromEditor}
    ></div>
  {/if}

  <p class="editor-help">
    Gunakan toolbar seperti editor WordPress (format heading, list, link, dan image) lalu simpan.
  </p>
</div>
