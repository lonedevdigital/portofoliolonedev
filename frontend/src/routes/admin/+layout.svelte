<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminShell from '$lib/components/AdminShell.svelte';
  import { getJson } from '$lib/api';

  let checkingAuth = true;
  let isAuthenticated = false;

  async function ensureAuthenticated() {
    checkingAuth = true;

    try {
      const data = await getJson('/api/auth/me');
      isAuthenticated = Boolean(data?.authenticated);
    } catch {
      isAuthenticated = false;
    }

    if (!isAuthenticated && typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname || '/admin');
      goto(`/login?next=${next}`);
    }

    checkingAuth = false;
  }

  onMount(ensureAuthenticated);
</script>

{#if checkingAuth}
  <div class="container" style="padding: 2rem 0;">Checking authentication...</div>
{:else if isAuthenticated}
  <AdminShell>
    <slot />
  </AdminShell>
{/if}