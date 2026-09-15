<script>
  import { base } from '$app/paths';
  import { teamsDb } from '$lib/stores/gameStore.js';

  export let teamId = '';
  export let name = '';
  export let state = '';
  export let size = 'w-6 h-6';

  $: teamObj = ($teamsDb && teamId) ? $teamsDb[teamId] : null;

  $: parts = teamId ? teamId.split('/') : [];
  $: clubeKey = teamObj?.clube || parts[0] || name || '';
  $: estadoSlug = teamObj?.estado_slug || parts[1] || state || '';
  $: teamName = teamObj?.nome || name || clubeKey || '';

  $: basePath = base ? base.replace(/\/$/, '') : '';

  $: primaryImgSrc = (estadoSlug && clubeKey)
    ? `${basePath}/teams/${encodeURIComponent(estadoSlug)}/${encodeURIComponent(clubeKey)}.png`
    : '';

  $: fallbackImgSrc = (estadoSlug && teamName && teamName !== clubeKey)
    ? `${basePath}/teams/${encodeURIComponent(estadoSlug)}/${encodeURIComponent(teamName)}.png`
    : '';

  $: initials = teamName.substring(0, 3).toUpperCase() || 'FC';

  let hasError = false;
  let triedFallback = false;
  let currentSrc = '';

  $: if (primaryImgSrc) {
    currentSrc = primaryImgSrc;
    hasError = false;
    triedFallback = false;
  }

  function handleError() {
    if (!triedFallback && fallbackImgSrc && currentSrc !== fallbackImgSrc) {
      triedFallback = true;
      currentSrc = fallbackImgSrc;
    } else {
      hasError = true;
    }
  }
</script>

<div class="{size} flex items-center justify-center shrink-0">
  {#if !hasError && currentSrc}
    <img
      src={currentSrc}
      on:error={handleError}
      alt={teamName}
      loading="lazy"
      class="w-full h-full object-contain drop-shadow-sm"
    />
  {:else}
    <div class="w-full h-full rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-extrabold text-[8px] tracking-tight text-slate-300 select-none shadow-sm">
      {initials}
    </div>
  {/if}
</div>
