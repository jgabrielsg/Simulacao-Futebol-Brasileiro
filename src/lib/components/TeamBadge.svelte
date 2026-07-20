<script>
  export let teamId;
  export let name = '';
  export let state = '';
  export let size = 'w-6 h-6';

  const parts = teamId ? teamId.split('/') : [];
  const clubeKey = parts[0] || name || '';
  const estadoSlug = parts[1] || state || '';
  const teamName = name || clubeKey || '';

  const primaryImgSrc = estadoSlug && clubeKey ? `/teams/${estadoSlug}/${clubeKey}.png` : '';
  const fallbackImgSrc = estadoSlug && teamName ? `/teams/${estadoSlug}/${teamName}.png` : '';
  const initials = teamName.substring(0, 3).toUpperCase();

  let hasError = false;
  let triedFallback = false;
  let currentSrc = primaryImgSrc;

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
      alt={name}
      class="w-full h-full object-contain"
    />
  {:else}
    <div class="w-full h-full rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-[9px] text-slate-300 select-none">
      {initials}
    </div>
  {/if}
</div>
