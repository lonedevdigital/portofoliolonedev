<script>
  import { page } from '$app/stores';
  import { adminLinks } from '$lib/adminLinks';
</script>

<div class="admin-layout">
  <aside class="admin-sidebar">
    <h2>Admin Dashboard</h2>
    <nav class="admin-nav">
      {#each adminLinks as link}
        <a
          href={link.href}
          class:active={
            $page.url.pathname === link.href ||
            (link.href !== '/admin' && $page.url.pathname.startsWith(link.href))
          }
        >
          {link.label}
        </a>
      {/each}
      <a href="/" style="margin-top:0.6rem;">Lihat Website</a>
    </nav>
  </aside>

  <section class="admin-content">
    <slot />
  </section>
</div>
