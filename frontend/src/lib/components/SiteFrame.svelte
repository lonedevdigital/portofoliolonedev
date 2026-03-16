<script>
  import { createStyleVars } from '$lib/defaultStyle';

  export let navigation = { items: [] };
  export let footer = {
    aboutText: '',
    contactEmail: '',
    whatsapp: '',
    address: '',
    socials: [],
    copyrightText: ''
  };
  export let style = { colors: {} };
  export let brand = 'LoneDev Services';

  $: styleVars = createStyleVars(style);
  $: wrapperStyle = Object.entries(styleVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
</script>

<div class="site-shell" style={wrapperStyle}>
  <header class="site-header">
    <div class="container site-header-inner">
      <a href="/" class="brand">{brand}</a>
      <nav class="nav-links">
        {#each navigation.items || [] as item}
          <a class="nav-link" href={item.href}>{item.label}</a>
        {/each}
      </nav>
    </div>
  </header>

  <main>
    <slot />
  </main>

  <footer class="footer" style="background: var(--footer-bg); color: var(--footer-text);">
    <div class="container footer-grid">
      <div>
        <h4>Tentang Kami</h4>
        <p>{footer.aboutText}</p>
      </div>
      <div>
        <h4>Kontak</h4>
        <p>Email: {footer.contactEmail}</p>
        <p>WhatsApp: {footer.whatsapp}</p>
        <p>{footer.address}</p>
      </div>
      <div>
        <h4>Sosial</h4>
        {#if footer.socials?.length}
          {#each footer.socials as social}
            <p><a href={social.url} target="_blank" rel="noreferrer">{social.label}</a></p>
          {/each}
        {:else}
          <p class="empty">Belum ada social link.</p>
        {/if}
      </div>
    </div>
    <div class="container">
      <small>{footer.copyrightText}</small>
    </div>
  </footer>
</div>
