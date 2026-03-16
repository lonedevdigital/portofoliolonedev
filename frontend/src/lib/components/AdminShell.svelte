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
      <button class="button-alt" style="margin-top:0.6rem; width:100%;" on:click={logout}>
        {loggingOut ? 'Signing out...' : 'Logout'}
      </button>
    </nav>
  </aside>

  <section class="admin-content">
    <slot />
  </section>
</div>