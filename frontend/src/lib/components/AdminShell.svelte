<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { adminLinks } from '$lib/adminLinks';
  import { postJson } from '$lib/api';

  let loggingOut = false;

  async function logout() {
    if (loggingOut) {
      return;
    }

    loggingOut = true;

    try {
      await postJson('/api/auth/logout', {});
    } catch {
      // ignore and continue redirect
    }

    loggingOut = false;
    goto('/login');
  }
</script>

<div class="admin-layout">
  <aside class="admin-sidebar">
    <div class="admin-sidebar-head">
      <p class="admin-kicker">LoneDev Control Center</p>
      <h2>Admin Workspace</h2>
      <p>Kelola konten, katalog layanan, style website, dan konfigurasi tampilan.</p>
    </div>
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
    </nav>
    <div class="admin-sidebar-foot">
      <a class="admin-link-action" href="/">Lihat Website</a>
      <button class="admin-logout" style="width:100%;" on:click={logout}>
        {loggingOut ? 'Signing out...' : 'Logout'}
      </button>
    </div>
  </aside>

  <section class="admin-content">
    <div class="admin-content-inner">
      <slot />
    </div>
  </section>
</div>
