<script>
  /**
   * TeamBadge component with state_slug image loading and 3-letter SVG crest fallback
   */
  export let teamId = "";
  export let name = "";
  export let state = "";
  export let size = "w-7 h-7";
  export let alt = "";

  let attempt = 0;

  $: parts = teamId ? teamId.split('/') : [];
  $: clubeKey = parts[0] || name || "";
  $: estadoSlug = parts[1] || (state ? state.toLowerCase().replace(/\s+/g, '_') : "");

  $: teamName = name || clubeKey || "TIM";
  $: initials = getInitials(teamName);

  $: if (teamId) {
    attempt = 0;
  }

  $: imgSrc = getImageSrc(estadoSlug, clubeKey, name, attempt);

  function getImageSrc(slug, key, teamNameAttr, currAttempt) {
    if (!slug) return null;
    if (currAttempt === 0 && key) {
      return `/teams/${slug}/${key}.png`;
    }
    if (currAttempt === 1 && teamNameAttr) {
      return `/teams/${slug}/${teamNameAttr}.png`;
    }
    return null;
  }

  function handleImageError() {
    if (attempt === 0 && name && name !== clubeKey) {
      attempt = 1;
    } else {
      attempt = 2;
    }
  }

  function getInitials(str) {
    if (!str) return "FC";
    const words = str.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    } else if (words.length === 2) {
      return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
    } else {
      return str.substring(0, 3).toUpperCase();
    }
  }

  $: bgHue = getHue(teamName);

  function getHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  }
</script>

<div class={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none ${size}`}>
  {#if imgSrc && attempt < 2}
    <img
      src={imgSrc}
      alt={alt || teamName}
      class="w-full h-full object-contain filter drop-shadow"
      on:error={handleImageError}
    />
  {:else}
    <!-- SVG Fallback Crest with 3-letter initials -->
    <div
      class="w-full h-full rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider text-white shadow-inner border border-white/20"
      style={`background: linear-gradient(135deg, hsl(${bgHue}, 70%, 35%), hsl(${(bgHue + 40) % 360}, 80%, 20%));`}
      title={`${teamName} (${state || ''})`}
    >
      {initials}
    </div>
  {/if}
</div>
