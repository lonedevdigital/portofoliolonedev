<script>
  import { onMount } from 'svelte';
  import { getJson } from '$lib/api';

  let loading = true;
  let error = '';
  let stats = {
    totalVisits: 0,
    visitsToday: 0,
    totalProducts: 0,
    totalPosts: 0,
    totalPublishedPosts: 0,
    totalCategories: 0,
    totalClients: 0,
    visitsByDay: []
  };

  async function loadStats() {
    loading = true;
    error = '';

    try {
      const data = await getJson('/api/admin/dashboard');
      stats = data.stats;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(loadStats);

  $: maxVisits = Math.max(1, ...(stats.visitsByDay || []).map((item) => Number(item.visits) || 0));
</script>

<div class="toolbar">
  <div>
    <h1 style="margin:0;">Dashboard</h1>
    <p style="margin:0.2rem 0 0; color:#64748b;">Statistik pengunjung dan konten website.</p>
  </div>
  <button class="button-main" on:click={loadStats}>Refresh</button>
</div>

{#if loading}
  <div class="panel">Loading statistik...</div>
{:else if error}
  <div class="notice">Gagal memuat statistik: {error}</div>
{:else}
  <section class="stats-grid">
    <div class="stat-card">
      <p>Total Pengunjung</p>
      <h3>{stats.totalVisits}</h3>
    </div>
    <div class="stat-card">
      <p>Pengunjung Hari Ini</p>
      <h3>{stats.visitsToday}</h3>
    </div>
    <div class="stat-card">
      <p>Total Product</p>
      <h3>{stats.totalProducts}</h3>
    </div>
    <div class="stat-card">
      <p>Total Post</p>
      <h3>{stats.totalPosts}</h3>
    </div>
    <div class="stat-card">
      <p>Post Published</p>
      <h3>{stats.totalPublishedPosts}</h3>
    </div>
    <div class="stat-card">
      <p>Total Category</p>
      <h3>{stats.totalCategories}</h3>
    </div>
    <div class="stat-card">
      <p>Total Clients</p>
      <h3>{stats.totalClients}</h3>
    </div>
  </section>

  <section class="panel" style="margin-top:1rem;">
    <h2 style="margin-top:0;">Trend Kunjungan 7 Hari</h2>
    <div class="chart">
      {#each stats.visitsByDay as item}
        <div class="chart-bar">
          <div
            class="bar"
            style={`height: ${Math.max(8, (Number(item.visits) / maxVisits) * 120)}px;`}
            title={`${item.date}: ${item.visits} kunjungan`}
          ></div>
          <strong>{item.visits}</strong>
          <small>{item.date.slice(5)}</small>
        </div>
      {/each}
    </div>
  </section>
{/if}
