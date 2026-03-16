<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getJson, postJson } from '$lib/api';

  let loading = true;
  let submitting = false;
  let error = '';
  let needsSetup = true;
  let forceSetup = false;

  let setupForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  let loginForm = {
    email: '',
    password: ''
  };

  $: requestedNext = $page.url.searchParams.get('next') || '/admin';
  $: nextPath = requestedNext.startsWith('/') ? requestedNext : '/admin';
  $: showSetupForm = needsSetup || forceSetup;

  async function initializeAuthPage() {
    loading = true;
    error = '';

    try {
      const [status, me] = await Promise.all([
        getJson('/api/auth/setup-status'),
        getJson('/api/auth/me')
      ]);

      if (me?.authenticated) {
        goto(nextPath);
        return;
      }

      needsSetup = Boolean(status?.needsSetup);
      forceSetup = false;
    } catch (err) {
      error = err.message;
      // Fallback aman: tetap tampilkan form create admin saat status setup gagal dideteksi.
      needsSetup = true;
    } finally {
      loading = false;
    }
  }

  async function submitSetup() {
    submitting = true;
    error = '';

    try {
      if (!setupForm.name.trim()) {
        throw new Error('Nama administrator wajib diisi');
      }

      if (!setupForm.email.trim()) {
        throw new Error('Email wajib diisi');
      }

      if (setupForm.password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }

      if (setupForm.password !== setupForm.confirmPassword) {
        throw new Error('Konfirmasi password tidak sama');
      }

      await postJson('/api/auth/setup', {
        name: setupForm.name,
        email: setupForm.email,
        password: setupForm.password
      });

      forceSetup = false;
      goto(nextPath);
    } catch (err) {
      error = err.message;
      await initializeAuthPage();
    } finally {
      submitting = false;
    }
  }

  async function submitLogin() {
    submitting = true;
    error = '';

    try {
      if (!loginForm.email.trim() || !loginForm.password) {
        throw new Error('Email dan password wajib diisi');
      }

      await postJson('/api/auth/login', {
        email: loginForm.email,
        password: loginForm.password
      });

      goto(nextPath);
    } catch (err) {
      error = err.message;
    } finally {
      submitting = false;
    }
  }

  onMount(initializeAuthPage);
</script>

<svelte:head>
  <title>Admin Login | LoneDev</title>
</svelte:head>

<div class="site-shell" style="--page-bg:#f7f8fb; background:var(--page-bg);">
  <div class="container" style="padding: 3rem 0;">
    <div class="panel" style="max-width:560px; margin:0 auto;">
      <h1 style="margin-top:0;">Administrator Access</h1>
      <p style="color:#64748b; margin-top:0;">
        {#if showSetupForm}
          Buat akun administrator pertama. Setelah tersimpan, fitur create account akan dinonaktifkan.
        {:else}
          Login menggunakan akun administrator yang sudah terdaftar.
        {/if}
      </p>

      {#if loading}
        <p>Loading authentication status...</p>
      {:else}
        {#if error}
          <div class="notice" style="margin-bottom:1rem;">{error}</div>
        {/if}

        {#if showSetupForm}
          <div class="form-grid">
            <label>
              Nama Admin
              <input bind:value={setupForm.name} placeholder="Nama lengkap" />
            </label>
            <label>
              Email
              <input type="email" bind:value={setupForm.email} placeholder="admin@domain.com" />
            </label>
            <label>
              Password
              <input type="password" bind:value={setupForm.password} placeholder="Minimal 6 karakter" />
            </label>
            <label>
              Konfirmasi Password
              <input type="password" bind:value={setupForm.confirmPassword} />
            </label>
          </div>

          <div class="button-row" style="margin-top: 1rem;">
            <button class="button-main" on:click={submitSetup} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Buat Administrator'}
            </button>
            <a class="button-outline" href="/">Kembali ke Website</a>
          </div>
        {:else}
          <div class="form-grid">
            <label>
              Email
              <input type="email" bind:value={loginForm.email} placeholder="admin@domain.com" />
            </label>
            <label>
              Password
              <input type="password" bind:value={loginForm.password} />
            </label>
          </div>

          <div class="button-row" style="margin-top: 1rem;">
            <button class="button-main" on:click={submitLogin} disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </button>
            <button
              class="button-outline"
              type="button"
              on:click={() => {
                forceSetup = true;
                error = '';
              }}
            >
              Belum Ada Admin? Create
            </button>
            <a class="button-outline" href="/">Kembali ke Website</a>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
