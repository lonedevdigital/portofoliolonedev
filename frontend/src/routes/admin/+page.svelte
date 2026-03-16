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
  $: publishedRatio = stats.totalPosts
    ? Math.round((Number(stats.totalPublishedPosts) / Number(stats.totalPosts)) * 100)
    : 0;
  $: statCards = [
    { label: 'Total Pengunjung', value: stats.totalVisits, note: 'Seluruh kunjungan tercatat' },
    { label: 'Pengunjung Hari Ini', value: stats.visitsToday, note: 'Update realtime harian' },
    { label: 'Product Aktif', value: stats.totalProducts, note: 'Layanan ditampilkan' },
    { label: 'Post Blog', value: stats.totalPosts, note: `${publishedRatio}% sudah publish` },
    { label: 'Category Blog', value: stats.totalCategories, note: 'Klasifikasi konten' },
    { label: 'Client', value: stats.totalClients, note: 'Bukti sosial aktif' }
  ];
</script>

<div class="toolbar">
  <div>
    <p class="toolbar-kicker">Admin Dashboard</p>
    <h1>Dashboard</h1>
    <p class="toolbar-sub">Statistik pengunjung, performa konten, dan snapshot operasional website.</p>
  </div>
  <button class="button-main" on:click={loadStats}>Refresh Statistik</button>
</div>

{#if loading}
  <div class="panel">Loading statistik...</div>
{:else if error}
  <div class="notice">Gagal memuat statistik: {error}</div>
{:else}
  <section class="stats-grid">
    {#each statCards as card}
      <article class="stat-card">
        <p>{card.label}</p>
        <h3>{Number(card.value).toLocaleString('id-ID')}</h3>
        <span class="stat-note">{card.note}</span>
      </article>
    {/each}
  </section>

  <section class="dashboard-grid">
    <article class="panel">
      <h2>Trend Kunjungan 7 Hari</h2>
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
    </article>

    <article class="panel">
      <h2>Snapshot Konten</h2>
      <div class="insight-list">
        <div class="insight-item">
          <span>Post Published</span>
          <strong>{Number(stats.totalPublishedPosts).toLocaleString('id-ID')}</strong>
        </div>
        <div class="insight-item">
          <span>Post Draft</span>
          <strong>{Math.max(0, Number(stats.totalPosts) - Number(stats.totalPublishedPosts))}</strong>
        </div>
        <div class="insight-item">
          <span>Rasio Publish</span>
          <strong>{publishedRatio}%</strong>
        </div>
        <div class="insight-item">
          <span>Rata-rata Visit / Hari</span>
          <strong>
            {Math.round(
              (stats.visitsByDay || []).reduce((sum, item) => sum + Number(item.visits || 0), 0) /
                Math.max(1, (stats.visitsByDay || []).length)
            )}
          </strong>
        </div>
      </div>
    </article>
  </section>
{/if}
