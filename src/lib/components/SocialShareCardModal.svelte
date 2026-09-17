<script>
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { toPng, toBlob } from 'html-to-image';
  import TeamBadge from './TeamBadge.svelte';
  import {
    X, Download, Copy, Check, Share2, Sparkles,
    Calendar, Bus, Plane, MapPin, TrendingDown,
    TrendingUp, ExternalLink, Link2, Shield, Loader2,
    Instagram, Twitter, Smartphone, Square
  } from 'lucide-svelte';

  export let isOpen = false;
  export let club = null;
  export let details = null;
  export let estadosMap = {};

  // Formats: '1:1' (Square - Feed / Twitter / LinkedIn) or '9:16' (Vertical - Stories / Instagram)
  let format = '1:1';
  let cardRef;
  let isCapturing = false;
  let copyImageSuccess = false;
  let copyLinkSuccess = false;
  let copyTimeout = null;

  const siteUrl = 'https://simulacao-divisoes-futebol-brasileiro.netlify.app';

  function closeModal() {
    isOpen = false;
    copyImageSuccess = false;
    copyLinkSuccess = false;
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(e) {
    if (isOpen && e.key === 'Escape') {
      closeModal();
    }
  }

  async function handleDownload() {
    if (!cardRef || isCapturing) return;
    isCapturing = true;
    try {
      await tick();
      // Allow slight render pause for fonts/images
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#030712'
      });

      const fileName = `fgv-impacto-${club?.name ? club.name.toLowerCase().replace(/\s+/g, '-') : 'clube'}-${format === '1:1' ? 'feed' : 'story'}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar PNG:', err);
    } finally {
      isCapturing = false;
    }
  }

  async function handleCopyImage() {
    if (!cardRef || isCapturing) return;
    isCapturing = true;
    try {
      await tick();
      await new Promise(r => setTimeout(r, 100));

      const blob = await toBlob(cardRef, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#030712'
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copyImageSuccess = true;
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => { copyImageSuccess = false; }, 3000);
      } else {
        // Fallback to download if ClipboardItem not supported
        await handleDownload();
      }
    } catch (err) {
      console.warn('Falha ao copiar imagem para clipboard, acionando download:', err);
      await handleDownload();
    } finally {
      isCapturing = false;
    }
  }

  async function handleCopyDirectLink() {
    if (!club) return;
    const link = `${siteUrl}/?clube=${encodeURIComponent(club.name)}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
      copyLinkSuccess = true;
      setTimeout(() => { copyLinkSuccess = false; }, 2500);
    } catch (e) {
      console.warn('Falha ao copiar link:', e);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && club}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    on:click={handleBackdrop}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Card Container -->
    <div
      class="bg-slate-900 border border-slate-800/90 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6 my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      on:click|stopPropagation
    >
      
      <!-- Top Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Share2 class="w-4 h-4 text-indigo-400" />
            Gerador de Card para Redes Sociais
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Exporte um card em alta definição para compartilhar no Instagram, Twitter/X, WhatsApp e LinkedIn.
          </p>
        </div>
        <button
          type="button"
          on:click={closeModal}
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Format Toggle Selector -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            type="button"
            on:click={() => format = '1:1'}
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer {format === '1:1' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/50' : 'text-slate-400 hover:text-white'}"
          >
            <Square class="w-3.5 h-3.5" />
            1:1 Quadrado (Feed / 𝕏 / LinkedIn)
          </button>
          <button
            type="button"
            on:click={() => format = '9:16'}
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer {format === '9:16' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/50' : 'text-slate-400 hover:text-white'}"
          >
            <Smartphone class="w-3.5 h-3.5" />
            9:16 Vertical (Stories / TikTok)
          </button>
        </div>

        <button
          type="button"
          on:click={handleCopyDirectLink}
          class="text-xs text-slate-400 hover:text-indigo-300 font-mono flex items-center gap-1 transition-colors cursor-pointer"
        >
          {#if copyLinkSuccess}
            <Check class="w-3.5 h-3.5 text-emerald-400" />
            <span class="text-emerald-400 font-bold">Link Copiado!</span>
          {:else}
            <Link2 class="w-3.5 h-3.5" />
            <span>Copiar Link do Clube</span>
          {/if}
        </button>
      </div>

      <!-- Preview Scrollable Area -->
      <div class="w-full flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-x-auto max-h-[60vh]">
        
        <!-- ======================================================== -->
        <!-- THE CARD DOM NODE CAPTURED BY html-to-image             -->
        <!-- ======================================================== -->
        <div
          bind:this={cardRef}
          class="relative bg-gradient-to-b from-slate-950 via-[#070c18] to-slate-950 border border-slate-800 text-slate-100 flex flex-col justify-between overflow-hidden shrink-0 shadow-2xl select-none"
          style={`
            width: ${format === '1:1' ? '540px' : '440px'};
            min-height: ${format === '1:1' ? '540px' : '780px'};
            padding: ${format === '1:1' ? '28px' : '32px 28px'};
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          `}
        >
          <!-- Subtle Decorative Grid / Ambient Glow -->
          <div class="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div class="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <!-- 1. Header with FGV EMAp Institutional Insignia -->
          <div class="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs shadow-md">
                FGV
              </div>
              <div>
                <span class="text-xs font-black text-white tracking-wider block uppercase leading-none">FGV EMAp</span>
                <span class="text-[9px] text-indigo-300 font-medium tracking-tight block mt-0.5">Escola de Matemática Aplicada</span>
              </div>
            </div>

            <div class="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 tracking-wider uppercase">
              Pesquisa Operacional & TCC
            </div>
          </div>

          <!-- 2. Club Brand Header -->
          <div class="relative z-10 my-4 flex items-center gap-4">
            <div class="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shrink-0">
              <TeamBadge
                teamId={club.teamId}
                name={club.name}
                state={club.estadoSlug}
                size={format === '1:1' ? 'w-16 h-16' : 'w-20 h-20'}
              />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold {
                  club.divisao === 'Série A' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  club.divisao === 'Série B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  club.divisao === 'Série C' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                  club.divisao === 'Série D' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }">
                  {club.divisao} Proposta
                </span>

                {#if club.rank}
                  <span class="text-[10px] font-mono font-semibold text-slate-400">
                    #{club.rank} Ranking Nacional
                  </span>
                {/if}
              </div>

              <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase truncate">
                {club.name}
              </h2>
              
              <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin class="w-3 h-3 text-slate-500 shrink-0" />
                <span>{club.cidade} · {club.estadoNome} ({club.uf})</span>
              </p>
            </div>
          </div>

          <!-- 3. Dynamic Impact Body (3 Scenarios) -->
          <div class="relative z-10 flex-1 flex flex-col justify-center my-2">
            {#if (club.divisao === 'Série C' || club.divisao === 'Série D') && details}
              <!-- CASE: SERIES C & D (DETERMINISTIC ADVANTAGES) -->
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2.5">
                  
                  <!-- Metric 1: Jogos Garantidos -->
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Calendário Oficial</span>
                    <div class="flex items-baseline gap-1.5 mt-0.5">
                      <span class="text-2xl font-black text-white">{details.proposto.jogos_garantidos}</span>
                      <span class="text-xs font-bold text-slate-300">Jogos</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-400 block mt-0.5">
                      +{details.vantagens.delta_jogos} jogos vs CBF atual
                    </span>
                  </div>

                  <!-- Metric 2: Km Total Evitado -->
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Viagens Poupadas</span>
                    <div class="flex items-baseline gap-1.5 mt-0.5">
                      <span class="text-2xl font-black text-cyan-300">
                        {details.vantagens.delta_km_total < 0 ? Math.abs(details.vantagens.delta_km_total).toLocaleString('pt-BR') : '0'}
                      </span>
                      <span class="text-xs font-bold text-cyan-400">km</span>
                    </div>
                    <span class="text-[10px] font-bold text-cyan-400 block mt-0.5">
                      {details.vantagens.delta_km_total < 0 ? `-${Math.abs(details.vantagens.delta_km_total_pct)}% em deslocamento` : '100% regionalizado'}
                    </span>
                  </div>

                  <!-- Metric 3: Distância Média -->
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Raio Médio / Jogo</span>
                    <div class="flex items-baseline gap-1.5 mt-0.5">
                      <span class="text-2xl font-black text-emerald-300">{details.proposto.km_medio}</span>
                      <span class="text-xs font-bold text-emerald-400">km</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-300 block mt-0.5">
                      {details.vantagens.delta_km_medio < 0 ? `-${Math.abs(details.vantagens.delta_km_medio_pct)}% vs CBF` : 'Viagens curtas'}
                    </span>
                  </div>

                  <!-- Metric 4: Modal Rodoviário -->
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Malha Rodoviária</span>
                    <div class="flex items-baseline gap-1.5 mt-0.5">
                      <span class="text-2xl font-black text-indigo-300">{details.proposto.modal_rodoviario_pct}%</span>
                      <span class="text-xs font-bold text-indigo-400">Ônibus</span>
                    </div>
                    <span class="text-[10px] font-bold text-indigo-300 block mt-0.5">
                      {details.ttp}
                    </span>
                  </div>

                </div>

                <!-- League Banner -->
                <div class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-[9px] font-mono uppercase text-slate-400 block">Chave Regional</span>
                    <span class="font-bold text-white text-xs">{details.liga}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                    {details.total_clubes_liga} Clubes
                  </span>
                </div>

                <!-- Extra 9:16 Vertical Content: Opponents Pills -->
                {#if format === '9:16' && details.adversarios?.length > 0}
                  <div class="space-y-1.5 pt-1 text-left">
                    <span class="text-[9px] font-mono uppercase text-slate-400 block">
                      Adversários Confirmados na Chave:
                    </span>
                    <div class="flex flex-wrap gap-1.5">
                      {#each details.adversarios.slice(0, 7) as opp}
                        <span class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium">
                          {opp.nome} ({opp.uf})
                        </span>
                      {/each}
                      {#if details.adversarios.length > 7}
                        <span class="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-400">
                          +{details.adversarios.length - 7} outros
                        </span>
                      {/if}
                    </div>
                  </div>
                {/if}

              </div>

            {:else if club.divisao === 'Série A' || club.divisao === 'Série B'}
              <!-- CASE: SERIES A & B -->
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-left">
                <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Shield class="w-4 h-4" />
                  <span>38 Rodadas Nacionais Preservadas</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">
                  O {club.name} mantém integralmente a fórmula nacional consagrada da {club.divisao} em turno e returno espelhado, sem redução de datas ou receitas de transmissão.
                </p>
                <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <strong class="text-white">Impacto Sistêmico:</strong> A reestruturação da base em {club.estadoNome} garante que os clubes de menor investimento tenham calendário anual de 10 meses, valorizando o ecossistema e os direitos dos atletas no estado.
                </div>
              </div>

            {:else}
              <!-- CASE: ESTADUAL / ACESSO MERITOCRÁTICO -->
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-left">
                <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <TrendingUp class="w-4 h-4" />
                  <span>Porta de Entrada Meritocrática na Série D</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">
                  Pelo modelo proposto pela FGV, o estado de <strong>{club.estadoNome}</strong> dispõe de cotas canônicas fixas para a Série D de 22 partidas com 100% de logística rodoviária.
                </p>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-left">
                  <div class="p-2 rounded bg-slate-950 border border-slate-800">
                    <span class="text-[9px] uppercase text-slate-400 block">Vagas Série D</span>
                    <span class="text-sm font-bold text-emerald-400">{estadosMap[club.uf]?.vagas_canonicas_serie_d || 2} diretas</span>
                  </div>
                  <div class="p-2 rounded bg-slate-950 border border-slate-800">
                    <span class="text-[9px] uppercase text-slate-400 block">Calendário</span>
                    <span class="text-sm font-bold text-indigo-300">22 Rodadas</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- 4. Watermark & Research URL Footer -->
          <div class="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div class="text-left">
              <span class="font-bold text-slate-300 block leading-tight">Reestruturação do Futebol Brasileiro</span>
              <span class="text-[8px] text-slate-400 block">Pesquisa Operacional & Otimização Combinatória</span>
            </div>
            <div class="text-right">
              <span class="text-indigo-400 font-bold block text-[10px]">simulacao-divisoes-futebol-brasileiro.netlify.app</span>
              <span class="text-[8px] text-slate-400 block">Acesse o simulador interativo</span>
            </div>
          </div>

        </div>

      </div>

      <!-- Action Footer Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div class="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles class="w-4 h-4 text-indigo-400" />
          <span>Imagem renderizada em 2x (alta resolução retina)</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            on:click={handleCopyImage}
            disabled={isCapturing}
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
          >
            {#if copyImageSuccess}
              <Check class="w-4 h-4 text-emerald-400" />
              <span class="text-emerald-400">Imagem Copiada!</span>
            {:else}
              <Copy class="w-4 h-4 text-slate-300" />
              <span>Copiar Imagem</span>
            {/if}
          </button>

          <button
            type="button"
            on:click={handleDownload}
            disabled={isCapturing}
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/60 disabled:opacity-50"
          >
            {#if isCapturing}
              <Loader2 class="w-4 h-4 animate-spin text-white" />
              <span>Processando...</span>
            {:else}
              <Download class="w-4 h-4" />
              <span>Baixar Card (PNG)</span>
            {/if}
          </button>
        </div>
      </div>

    </div>
  </div>
{/if}
