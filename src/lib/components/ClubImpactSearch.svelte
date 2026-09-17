<script>
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import TeamBadge from './TeamBadge.svelte';
  import SocialShareCardModal from './SocialShareCardModal.svelte';
  import {
    Search, X, ArrowRight, MapPin, Calendar, Bus, Plane,
    Shield, Trophy, ExternalLink, Sparkles, Info, Building2,
    CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Share2, Copy, Check, Send,
    ChevronDown, ChevronUp, Route, Filter, Scale, Camera
  } from 'lucide-svelte';

  const basePath = base ? base.replace(/\/$/, '') : '';

  let allClubs = [];
  let estadosMap = {};
  let clubImpactDetails = {};
  let isReady = false;

  let query = '';
  let searchInputEl;
  let isOpen = false;
  let selectedClub = null;
  let activeIndex = -1;

  let copied = false;
  let copyTimeout = null;
  let showShareModal = false;

  // Round filter: 'all' | 'away' | 'home'
  let roundFilter = 'all';
  let showAllRounds = false;

  // Normalized search helper (case-insensitive & accent-insensitive)
  function normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  onMount(async () => {
    try {
      const [analyticsRes, teamsDbRes, detailsRes] = await Promise.all([
        fetch(`${basePath}/json/pagerank_analytics.json`),
        fetch(`${basePath}/json/teams_db.json`),
        fetch(`${basePath}/json/club_impact_details.json`)
      ]);

      if (analyticsRes.ok && teamsDbRes.ok) {
        const analyticsData = await analyticsRes.json();
        const teamsDbData = await teamsDbRes.json();
        const teamsDbList = Object.values(teamsDbData);

        if (detailsRes.ok) {
          clubImpactDetails = await detailsRes.json();
        }

        // Build states map
        if (analyticsData.estados) {
          analyticsData.estados.forEach(st => {
            estadosMap[st.uf] = st;
          });
        }

        // Build unified club search index
        allClubs = (analyticsData.clubes || []).map(c => {
          const cNorm = normalize(c.clube);
          let match = teamsDbList.find(x => x.uf === c.uf && (normalize(x.clube) === cNorm || normalize(x.nome) === cNorm));
          if (!match) {
            match = teamsDbList.find(x => x.uf === c.uf && (normalize(x.clube).includes(cNorm) || cNorm.includes(normalize(x.clube))));
          }

          const tid = match ? match.id : (c.clube.toUpperCase() + '/' + (match?.estado_slug || c.uf.toLowerCase()));

          return {
            name: c.clube,
            searchName: cNorm,
            uf: c.uf,
            divisao: c.divisao,
            liga: c.liga,
            cidade: c.cidade,
            estadio: c.estadio,
            rank: c.rank,
            score: c.pagerank_score,
            teamId: tid,
            estadoSlug: match ? match.estado_slug : '',
            estadoNome: match ? match.estado : c.uf
          };
        });

        isReady = true;

        // Auto-select club from URL query param (?clube=...)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const clubParam = params.get('clube');
          if (clubParam) {
            selectPreset(clubParam);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dados de impacto de clubes:', err);
    }
  });

  // Filtered autocomplete results (max 7)
  $: results = (isReady && query.trim().length >= 2)
    ? allClubs.filter(c => {
        const q = normalize(query);
        return c.searchName.includes(q) || normalize(c.cidade).includes(q) || normalize(c.uf).includes(q);
      }).slice(0, 7)
    : [];

  // Reactive details for currently selected club
  $: currentClubDetails = (selectedClub && selectedClub.teamId) ? clubImpactDetails[selectedClub.teamId] : null;

  // Filtered rounds
  $: filteredRodadas = (() => {
    if (!currentClubDetails?.rodadas) return [];
    if (roundFilter === 'away') return currentClubDetails.rodadas.filter(r => !r.isHome);
    if (roundFilter === 'home') return currentClubDetails.rodadas.filter(r => r.isHome);
    return currentClubDetails.rodadas;
  })();

  $: visibleRodadas = showAllRounds ? filteredRodadas : filteredRodadas.slice(0, 8);

  function selectClub(club) {
    selectedClub = club;
    query = club.name;
    isOpen = false;
    activeIndex = -1;
    roundFilter = 'all';
    showAllRounds = false;

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('clube', club.name);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function clearSearch() {
    selectedClub = null;
    query = '';
    isOpen = false;
    activeIndex = -1;
    roundFilter = 'all';
    showAllRounds = false;
    if (searchInputEl) searchInputEl.focus();

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('clube');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }

  function handleKeydown(e) {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % results.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + results.length) % results.length;
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectClub(results[activeIndex]);
    } else if (e.key === 'Escape') {
      isOpen = false;
    }
  }

  // Find regional neighbor clubs for Series A and B spillover
  function getRegionalClubs(club) {
    if (!club) return [];
    return allClubs
      .filter(c => c.uf === club.uf && c.name !== club.name)
      .sort((a, b) => {
        const order = { 'Série C': 1, 'Série D': 2, 'Estadual (Amador)': 3, 'Série B': 4, 'Série A': 5 };
        return (order[a.divisao] || 9) - (order[b.divisao] || 9) || a.rank - b.rank;
      })
      .slice(0, 4);
  }

  // Preset Pills Popular Groups
  const PRESET_GROUPS = [
    {
      category: 'Série A & B (Elite)',
      badge: '38 Rodadas',
      color: 'text-amber-400',
      clubs: [
        { name: 'Flamengo', uf: 'RJ', label: 'Flamengo (RJ)' },
        { name: 'Sport', uf: 'PE', label: 'Sport (PE)' },
        { name: 'CRB', uf: 'AL', label: 'CRB (AL)' }
      ]
    },
    {
      category: 'Série C Proposta',
      badge: '26 a 30 Jogos',
      color: 'text-indigo-400',
      clubs: [
        { name: 'Santa Cruz', uf: 'PE', label: 'Santa Cruz (PE)' },
        { name: 'Paysandu', uf: 'PA', label: 'Paysandu (PA)' },
        { name: 'América', uf: 'RN', label: 'América (RN)' },
        { name: 'Joinville', uf: 'SC', label: 'Joinville (SC)' },
        { name: 'Figueirense', uf: 'SC', label: 'Figueirense (SC)' },
        { name: 'CSA', uf: 'AL', label: 'CSA (AL)' },
        { name: 'Ypiranga', uf: 'RS', label: 'Ypiranga (RS)' }
      ]
    },
    {
      category: 'Série D Proposta',
      badge: '14 a 22 Jogos',
      color: 'text-emerald-400',
      clubs: [
        { name: 'Portuguesa', uf: 'SP', label: 'Portuguesa (SP)' },
        { name: 'ASA', uf: 'AL', label: 'ASA (AL)' },
        { name: 'Icasa', uf: 'CE', label: 'Icasa (CE)' },
        { name: 'Gama', uf: 'DF', label: 'Gama (DF)' },
        { name: 'Rio Grande', uf: 'RS', label: 'Rio Grande (RS)' }
      ]
    }
  ];

  function selectPreset(presetName, presetUf) {
    if (!allClubs || allClubs.length === 0) return;
    const q = normalize(presetName);
    let found = allClubs.find(c => {
      const matchName = c.searchName.includes(q) || q.includes(c.searchName);
      return presetUf ? (matchName && c.uf === presetUf) : matchName;
    });
    if (!found) {
      found = allClubs.find(c => c.searchName.includes(q) || q.includes(c.searchName));
    }
    if (found) selectClub(found);
  }

  onDestroy(() => {
    if (copyTimeout) clearTimeout(copyTimeout);
  });

  function generateShareText(club) {
    if (!club) return '';
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://simulacao-futebol-brasileiro.vercel.app';
    const details = club.teamId ? clubImpactDetails[club.teamId] : null;

    if (club.divisao === 'Série A' || club.divisao === 'Série B') {
      return `📊 Pela proposta da FGV EMAp de reestruturação do futebol brasileiro, o ${club.name} mantém integralmente as 38 rodadas na ${club.divisao}, enquanto a base do futebol em ${club.estadoNome} ganha calendário de abril a novembro. Veja o impacto: ${siteUrl}`;
    } else if (details) {
      const deltaKmStr = details.vantagens.delta_km_total < 0
        ? `, reduzindo viagens em ${Math.abs(details.vantagens.delta_km_total).toLocaleString('pt-BR')} km (-${Math.abs(details.vantagens.delta_km_total_pct)}%)`
        : '';
      const kmMedioStr = details.vantagens.delta_km_medio < 0
        ? ` e distância média para ${details.proposto.km_medio} km/jogo`
        : '';
      return `📊 Pela proposta da FGV EMAp, o ${details.nome} (${details.uf}) salta para ${details.proposto.jogos_garantidos} jogos oficiais na ${details.divisao} (+${details.vantagens.delta_jogos} jogos vs CBF)${deltaKmStr}${kmMedioStr} com turnês ${details.ttp}. Veja o estudo: ${siteUrl}`;
    } else if (club.divisao === 'Série C' || club.divisao === 'Série D') {
      return `📊 Pela proposta da FGV EMAp, o ${club.name} tem calendário oficial garantido de abril a novembro na ${club.liga}, com foco em viagens rodoviárias e queda de 56% no custo por partida. Veja o estudo: ${siteUrl}`;
    } else {
      const st = estadosMap[club.uf];
      const vagas = st ? `${st.vagas_canonicas_serie_d} vagas diretas` : 'cotas fixas';
      return `📊 Pela proposta da FGV EMAp, ${club.estadoNome} possui ${vagas} na Série D de 22 jogos (100% rodoviária), garantindo acesso meritocrático para o ${club.name} via Estadual. Veja o estudo: ${siteUrl}`;
    }
  }

  async function copyDiagnosis() {
    if (!selectedClub) return;
    const text = generateShareText(selectedClub);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      copied = true;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => { copied = false; }, 2500);
    } catch (e) {
      console.warn('Falha ao copiar:', e);
    }
  }

  function shareWhatsApp() {
    if (!selectedClub) return;
    const text = encodeURIComponent(generateShareText(selectedClub));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  function shareTwitter() {
    if (!selectedClub) return;
    const text = encodeURIComponent(generateShareText(selectedClub));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }
</script>

<section class="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl relative overflow-visible">
  
  <!-- Header Title (Sober & Compact) -->
  <div class="space-y-1.5 max-w-2xl">
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center justify-center p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
        <Search class="w-3.5 h-3.5" />
      </span>
      <h3 class="text-base sm:text-lg font-bold text-white tracking-tight">
        Consulte a Realidade do Seu Clube na Nova Pirâmide
      </h3>
    </div>
    <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
      Pesquise qualquer clube brasileiro para conferir divisão atribuída, comparativo oficial com a CBF, adversários da chave regional e ordem de rodadas.
    </p>
  </div>

  <!-- Search Input Container -->
  <div class="relative max-w-3xl space-y-3">
    <div class="relative flex items-center">
      <div class="absolute left-3.5 pointer-events-none text-slate-400">
        <Search class="w-4 h-4" />
      </div>

      <input
        bind:this={searchInputEl}
        type="text"
        bind:value={query}
        on:input={() => { isOpen = true; activeIndex = -1; }}
        on:focus={() => { if (query.trim().length >= 2) isOpen = true; }}
        on:keydown={handleKeydown}
        placeholder="Digite o nome do seu clube (ex: Santa Cruz, Ypiranga, Paraná, Portuguesa, ASA)..."
        class="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 transition-all outline-none"
      />

      {#if query}
        <button
          type="button"
          on:click={clearSearch}
          class="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Limpar busca"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>

    <!-- Autocomplete Dropdown List -->
    {#if isOpen && results.length > 0}
      <ul
        class="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-72 overflow-y-auto"
      >
        {#each results as club, idx}
          <li>
            <button
              type="button"
              on:click={() => selectClub(club)}
              class="w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer {idx === activeIndex ? 'bg-indigo-950/40 text-white' : 'hover:bg-slate-800/70 text-slate-200'}"
            >
              <div class="flex items-center gap-3">
                <TeamBadge
                  teamId={club.teamId}
                  name={club.name}
                  state={club.estadoSlug}
                  size="w-6 h-6"
                />
                <div>
                  <span class="text-sm font-semibold text-white block leading-snug">{club.name}</span>
                  <span class="text-[11px] text-slate-400 block">{club.cidade} · {club.uf}</span>
                </div>
              </div>

              <!-- Division Tag Pill -->
              <div>
                {#if club.divisao === 'Série A'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">Série A</span>
                {:else if club.divisao === 'Série B'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">Série B</span>
                {:else if club.divisao === 'Série C'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">Série C</span>
                {:else if club.divisao === 'Série D'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">Série D</span>
                {:else}
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400">Estadual</span>
                {/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Quick Preset Suggestion Pills (Organized by Popular Divisions) -->
    {#if !selectedClub}
      <div class="pt-2 space-y-2.5">
        <span class="text-[11px] text-slate-400 font-mono block">Clubes sugeridos para consulta imediata:</span>

        <div class="space-y-2">
          {#each PRESET_GROUPS as group}
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold shrink-0 mr-1">
                {group.category}:
              </span>
              {#each group.clubs as preset}
                <button
                  type="button"
                  on:click={() => selectPreset(preset.name, preset.uf)}
                  class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[11px] font-medium text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- RESULT CONTAINER (CONDITIONAL 3 CASES) -->
  {#if selectedClub}
    <div class="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
      
      <!-- Club Identification Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div class="flex items-center gap-3.5">
          <TeamBadge
            teamId={selectedClub.teamId}
            name={selectedClub.name}
            state={selectedClub.estadoSlug}
            size="w-12 h-12"
          />
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-lg sm:text-xl font-black text-white">{selectedClub.name}</h4>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold {
                selectedClub.divisao === 'Série A' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' :
                selectedClub.divisao === 'Série B' ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300' :
                selectedClub.divisao === 'Série C' ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300' :
                selectedClub.divisao === 'Série D' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' :
                'bg-slate-800 border border-slate-700 text-slate-400'
              }">
                {selectedClub.divisao}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedClub.cidade} · {selectedClub.estadoNome} ({selectedClub.uf})</span>
              {#if selectedClub.rank}
                <span class="text-slate-600">•</span>
                <span class="font-mono text-indigo-300 font-semibold">#{selectedClub.rank} no Brasil</span>
                {#if selectedClub.score}
                  <span class="text-slate-600 hidden sm:inline">•</span>
                  <span class="text-slate-500 text-[11px] font-mono hidden sm:inline">PageRank {selectedClub.score.toFixed(4)}</span>
                {/if}
              {/if}
            </p>
          </div>
        </div>

        <button
          type="button"
          on:click={clearSearch}
          class="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <X class="w-3.5 h-3.5" />
          Pesquisar outro clube
        </button>
      </div>

      <!-- ======================================================= -->
      <!-- CASO 1: SÉRIES A E B (ELITE NACIONAL CONSOLIDADA)        -->
      <!-- ======================================================= -->
      {#if selectedClub.divisao === 'Série A' || selectedClub.divisao === 'Série B'}
        <div class="space-y-4">
          <!-- Sober Institutional Explanation -->
          <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5">
            <p>
              O <strong class="text-white">{selectedClub.name}</strong> disputa a <strong class="text-white">{selectedClub.divisao}</strong> e mantém o formato nacional consolidado de <strong>38 rodadas em turno e returno espelhado</strong>, sem qualquer redução de datas pelo modelo proposto.
            </p>
            <p class="text-slate-400 text-xs">
              A reformulação proposta atua diretamente nas divisões de acesso (Séries C e D). No entanto, o ecossistema do futebol em <strong>{selectedClub.estadoNome}</strong> ganha estabilidade com a garantia de calendário anual para os clubes do interior e da capital.
            </p>
          </div>

          <!-- Regional Spillover Grid -->
          <div class="space-y-2.5 pt-1">
            <span class="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Clubes de {selectedClub.estadoNome} beneficiados pela nova pirâmide:
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {#each getRegionalClubs(selectedClub) as regClub}
                <button
                  type="button"
                  on:click={() => selectClub(regClub)}
                  class="p-3 rounded-lg bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div class="flex items-center gap-2.5">
                    <TeamBadge
                      teamId={regClub.teamId}
                      name={regClub.name}
                      state={regClub.estadoSlug}
                      size="w-7 h-7"
                    />
                    <div>
                      <span class="text-xs font-bold text-white block group-hover:text-indigo-400 transition-colors">
                        {regClub.name}
                      </span>
                      <span class="text-[10px] text-slate-400 block truncate max-w-[170px]">
                        {regClub.liga}
                      </span>
                    </div>
                  </div>

                  <span class="text-[10px] font-mono px-2 py-0.5 rounded font-semibold {
                    regClub.divisao === 'Série C' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                    regClub.divisao === 'Série D' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }">
                    {regClub.divisao}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        </div>

      <!-- ======================================================= -->
      <!-- CASO 2: SÉRIES C E D (IMPACTO REAL & COMPARATIVO EXATO) -->
      <!-- ======================================================= -->
      {:else if selectedClub.divisao === 'Série C' || selectedClub.divisao === 'Série D'}
        
        {#if currentClubDetails}
          {@const det = currentClubDetails}
          <div class="space-y-6">
            
            <!-- 1. COMPARATIVO OFICIAL: STATUS QUO CBF VS. NOVA PIRÂMIDE FGV -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <Scale class="w-3.5 h-3.5" />
                  Comparativo Oficial: CBF 2026 vs. Proposta Nova
                </span>
                <span class="text-[11px] font-mono text-slate-400">
                  Origem: {det.baseline.divisao_origem}
                </span>
              </div>

              <!-- 4 Comparative Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left font-mono">
                
                <!-- Card 1: Jogos Garantidos -->
                <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Jogos Oficiais no Ano</span>
                  <div class="flex items-baseline gap-2">
                    <span class="text-xl sm:text-2xl font-black text-white">{det.proposto.jogos_garantidos}</span>
                    <span class="text-xs text-slate-400 line-through">CBF: {det.baseline.jogos_garantidos}</span>
                  </div>
                  <div>
                    {#if det.vantagens.delta_jogos > 0}
                      <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <TrendingUp class="w-3 h-3" />
                        +{det.vantagens.delta_jogos} jogos (+{det.vantagens.delta_jogos_pct}%)
                      </span>
                    {:else}
                      <span class="text-xs text-slate-400">Manutenção de calendário</span>
                    {/if}
                  </div>
                  <span class="text-[10px] font-sans text-slate-400 block pt-0.5">Turno e returno completo</span>
                </div>

                <!-- Card 2: Km Total de Deslocamento -->
                <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Quilometragem Total</span>
                  <div class="flex items-baseline gap-2">
                    <span class="text-xl sm:text-2xl font-black text-white">{det.proposto.km_total.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div>
                    {#if det.baseline.km_total > 0 && det.vantagens.delta_km_total < 0}
                      <span class="inline-flex items-center gap-1 text-xs font-bold text-cyan-400">
                        <TrendingDown class="w-3 h-3" />
                        {det.vantagens.delta_km_total.toLocaleString('pt-BR')} km ({det.vantagens.delta_km_total_pct}%)
                      </span>
                    {:else if det.baseline.km_total === 0}
                      <span class="text-xs text-indigo-300 font-bold">100% viagens regionais</span>
                    {:else}
                      <span class="text-xs text-slate-400">Base expandida de jogos</span>
                    {/if}
                  </div>
                  <span class="text-[10px] font-sans text-slate-400 block pt-0.5">
                    {det.baseline.km_total > 0 ? `vs. ${det.baseline.km_total.toLocaleString('pt-BR')} km na CBF` : 'Inexistente na CBF'}
                  </span>
                </div>

                <!-- Card 3: Km Médio por Jogo Fora -->
                <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Distância Média / Jogo</span>
                  <div class="flex items-baseline gap-2">
                    <span class="text-xl sm:text-2xl font-black text-white">{det.proposto.km_medio.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div>
                    {#if det.baseline.km_medio > 0 && det.vantagens.delta_km_medio < 0}
                      <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <TrendingDown class="w-3 h-3" />
                        {det.vantagens.delta_km_medio.toLocaleString('pt-BR')} km ({det.vantagens.delta_km_medio_pct}%)
                      </span>
                    {:else if det.baseline.km_medio === 0}
                      <span class="text-xs text-emerald-300 font-bold">Viagens curtas</span>
                    {:else}
                      <span class="text-xs text-slate-400">Proximidade local</span>
                    {/if}
                  </div>
                  <span class="text-[10px] font-sans text-slate-400 block pt-0.5">
                    {det.baseline.km_medio > 0 ? `vs. ${det.baseline.km_medio.toLocaleString('pt-BR')} km na CBF` : 'Foco rodoviário'}
                  </span>
                </div>

                <!-- Card 4: Modal Predominante -->
                <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Logística Predominante</span>
                  <div class="flex items-baseline gap-1.5">
                    <Bus class="w-4 h-4 text-indigo-400" />
                    <span class="text-lg sm:text-xl font-black text-white">{det.proposto.modal_rodoviario_pct}% Ônibus</span>
                  </div>
                  <span class="text-xs font-bold text-indigo-300 block">{det.ttp}</span>
                  <span class="text-[10px] font-sans text-slate-400 block pt-0.5">
                    CBF: {det.baseline.modal_aereo_pct}% em voos avulsos
                  </span>
                </div>

              </div>

              <!-- Context Callout -->
              <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                <Info class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div class="space-y-1 leading-relaxed">
                  <p>
                    <strong>Diagnóstico do Modelo CBF:</strong> {det.baseline.gargalo}.
                  </p>
                  <p class="text-slate-400">
                    <strong>Ganho Estrutural na FGV:</strong> O {det.nome} tem <strong>{det.proposto.jogos_garantidos} rodadas garantidas ({det.proposto.jogos_casa} em casa e {det.proposto.jogos_fora} fora)</strong> disputadas de abril a novembro, viabilizando bilheteria contínua, contratos de trabalho anuais e preservação física do elenco via {det.ttp}.
                  </p>
                </div>
              </div>
            </div>

            <!-- 2. A LIGA & SEUS ADVERSÁRIOS -->
            <div class="space-y-3 pt-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                    Composição da Chave Regional
                  </span>
                  <h5 class="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    {det.liga}
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                      {det.total_clubes_liga} Clubes
                    </span>
                  </h5>
                </div>
                <span class="text-xs text-slate-400 font-mono">
                  {det.ttpDesc}
                </span>
              </div>

              <p class="text-xs text-slate-300">
                O <strong>{det.nome}</strong> enfrenta os outros <strong>{det.adversarios.length} clubes</strong> da chave em turno e returno espelhado:
              </p>

              <!-- Opponents Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                {#each det.adversarios as opp}
                  <button
                    type="button"
                    on:click={() => {
                      const peerClub = allClubs.find(c => c.teamId === opp.id || (c.name.toUpperCase() === opp.nome.toUpperCase() && c.uf === opp.uf));
                      if (peerClub) selectClub(peerClub);
                    }}
                    class="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <TeamBadge
                        teamId={opp.id}
                        name={opp.nome}
                        state={opp.estadoSlug}
                        size="w-5 h-5"
                      />
                      <span class="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                        {opp.nome}
                      </span>
                    </div>
                    <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 ml-1">
                      {opp.uf}
                    </span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- 3. CALENDÁRIO COMPLETO: RODADA A RODADA -->
            <div class="space-y-3 pt-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Programação Oficial da 1ª Temporada
                  </span>
                  <h5 class="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    Calendário Rodada a Rodada & Rotas
                  </h5>
                </div>

                <!-- Round Filter Buttons -->
                <div class="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-[11px] font-mono self-start sm:self-auto">
                  <button
                    type="button"
                    on:click={() => roundFilter = 'all'}
                    class="px-2.5 py-1 rounded-md transition-all cursor-pointer {roundFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}"
                  >
                    Todas ({det.rodadas.length})
                  </button>
                  <button
                    type="button"
                    on:click={() => roundFilter = 'away'}
                    class="px-2.5 py-1 rounded-md transition-all cursor-pointer {roundFilter === 'away' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}"
                  >
                    Viagens Fora ({det.proposto.jogos_fora})
                  </button>
                  <button
                    type="button"
                    on:click={() => roundFilter = 'home'}
                    class="px-2.5 py-1 rounded-md transition-all cursor-pointer {roundFilter === 'home' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}"
                  >
                    Em Casa ({det.proposto.jogos_casa})
                  </button>
                </div>
              </div>

              <!-- Matches List -->
              <div class="space-y-1.5 font-mono text-xs">
                {#each visibleRodadas as r}
                  <div class="p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 {
                    r.isHome
                      ? 'bg-slate-950/80 border-slate-800/80 text-slate-200'
                      : 'bg-slate-900/60 border-slate-800 text-white hover:border-slate-700'
                  }">
                    
                    <!-- Match Left: Round & Opponent -->
                    <div class="flex items-center gap-3">
                      <span class="w-10 text-center font-bold px-1.5 py-0.5 rounded text-[11px] {
                        r.isHome ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }">
                        R{r.rodada < 10 ? '0' + r.rodada : r.rodada}
                      </span>

                      <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded {
                        r.isHome ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                      }">
                        {r.isHome ? 'CASA' : 'FORA'}
                      </span>

                      <div class="flex items-center gap-2">
                        <TeamBadge
                          teamId={r.opponentId}
                          name={r.opponentNome}
                          state={r.opponentEstadoSlug}
                          size="w-5 h-5"
                        />
                        <span class="font-bold text-white text-xs">{r.opponentNome}</span>
                        <span class="text-[10px] text-slate-400">({r.opponentUf})</span>
                      </div>
                    </div>

                    <!-- Match Right: Logistical details -->
                    <div class="flex items-center justify-between sm:justify-end gap-3 text-[11px] border-t sm:border-t-0 border-slate-800/60 pt-1.5 sm:pt-0">
                      {#if r.isHome}
                        <span class="text-slate-400 text-[10px] font-sans">
                          Mando em {selectedClub.cidade} ({selectedClub.uf}) · 0 km
                        </span>
                      {:else}
                        <!-- Modal & Distance -->
                        <div class="flex items-center gap-2">
                          {#if r.modal === 'AIR'}
                            <span class="inline-flex items-center gap-1 text-cyan-400 text-[11px] font-bold">
                              <Plane class="w-3.5 h-3.5" />
                              Aéreo
                            </span>
                          {:else}
                            <span class="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                              <Bus class="w-3.5 h-3.5" />
                              Ônibus Leito
                            </span>
                          {/if}

                          <span class="text-slate-300 font-bold">{r.km.toLocaleString('pt-BR')} km</span>
                        </div>

                        <!-- Logistics Tag -->
                        <div>
                          {#if r.tipo_trecho === 'INICIO_TURNE'}
                            <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 font-sans">
                              Início de Turnê
                            </span>
                          {:else if r.tipo_trecho === 'INTER_TURNE'}
                            <span class="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-sans">
                              Emenda TTP
                            </span>
                          {:else if r.tipo_trecho === 'FIM_TURNE'}
                            <span class="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 font-sans">
                              Fim de Turnê
                            </span>
                          {:else}
                            <span class="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-sans">
                              Bate-Volta
                            </span>
                          {/if}
                        </div>
                      {/if}
                    </div>

                  </div>
                {/each}
              </div>

              <!-- Expand / Collapse Schedule Button -->
              {#if filteredRodadas.length > 8}
                <div class="text-center pt-2">
                  <button
                    type="button"
                    on:click={() => showAllRounds = !showAllRounds}
                    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    {#if showAllRounds}
                      <ChevronUp class="w-3.5 h-3.5 text-indigo-400" />
                      Recolher lista de rodadas
                    {:else}
                      <ChevronDown class="w-3.5 h-3.5 text-indigo-400" />
                      Ver todas as {filteredRodadas.length} rodadas da temporada
                    {/if}
                  </button>
                </div>
              {/if}
            </div>

            <!-- Direct Navigation Links -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`/dashboard?clube=${encodeURIComponent(selectedClub.name)}&temporada=1`}
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-950/40"
              >
                Simular Temporada no Dashboard
                <ArrowRight class="w-3.5 h-3.5" />
              </a>

              <a
                href="/estudo-de-caso"
                class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Ver Rotas & Turnês no Estudo de Caso
                <ExternalLink class="w-3 h-3 text-slate-400" />
              </a>
            </div>

          </div>
        {:else}
          <!-- Fallback when details not yet loaded -->
          <div class="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
            <span class="text-sm font-bold text-white block">Carregando comparativo do clube...</span>
            <span class="text-xs text-slate-400 block">{selectedClub.liga}</span>
          </div>
        {/if}

      <!-- ======================================================= -->
      <!-- CASO 3: ESTADUAL (SEM DIVISÃO NACIONAL CBF ATUAL)       -->
      <!-- ======================================================= -->
      {:else}
        <div class="space-y-4">
          <!-- Institutional Context -->
          <div class="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
            <p>
              O <strong class="text-white">{selectedClub.name}</strong> disputa atualmente o Campeonato Estadual de <strong>{selectedClub.estadoNome}</strong> e fica sem calendário nacional oficial no 2º semestre no formato atual da CBF (encerrando suas atividades em abril).
            </p>
            <p class="text-slate-400 text-xs">
              Pela nova pirâmide da FGV, o estado de <strong>{selectedClub.estadoNome}</strong> dispõe de <strong>{estadosMap[selectedClub.uf]?.vagas_canonicas_serie_d || 'múltiplas'} vagas canônicas diretas</strong> para a Série D regionalizada, permitindo aos classificados do estadual um calendário contínuo de 22 partidas oficiais com 100% de logística rodoviária.
            </p>
          </div>

          <!-- State Federation Data Overview -->
          {#if estadosMap[selectedClub.uf]}
            {@const st = estadosMap[selectedClub.uf]}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono">
              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Vagas Série D (UF)</span>
                <span class="text-sm font-bold text-emerald-400 block">{st.vagas_canonicas_serie_d} vagas</span>
                <span class="text-[10px] font-sans text-slate-400 block">Via Estadual 1º Semestre</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Total UF na Pirâmide</span>
                <span class="text-sm font-bold text-white block">{st.total_piramide_real} clubes</span>
                <span class="text-[10px] font-sans text-slate-400 block">Séries A, B, C e D</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Clubes Profissionais</span>
                <span class="text-sm font-bold text-slate-200 block">{st.total_cadastro} clubes</span>
                <span class="text-[10px] font-sans text-slate-400 block">Cadastro estadual</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-sans block">Cobertura Federativa</span>
                <span class="text-sm font-bold text-indigo-400 block">{st.pct_atendida_cadastro}%</span>
                <span class="text-[10px] font-sans text-slate-400 block">Atendida nacionalmente</span>
              </div>
            </div>
          {/if}

          <!-- Link to Methodology Federation Distribution -->
          <div class="pt-1">
            <a
              href="/metodologia"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Ver Cálculo da Cota Canônica por Estado na Metodologia
              <ArrowRight class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      {/if}

      <!-- Social Sharing & Copy Action Bar -->
      <div class="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <Share2 class="w-3.5 h-3.5 text-indigo-400" />
          <span>Compartilhar diagnóstico oficial:</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            on:click={() => showShareModal = true}
            class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs shadow-md shadow-indigo-950/50"
            title="Gerar card visual em alta definição para Instagram, Twitter e LinkedIn"
          >
            <Camera class="w-3.5 h-3.5" />
            <span>📸 Gerar Card para Redes</span>
          </button>

          <button
            type="button"
            on:click={copyDiagnosis}
            class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium"
            title="Copiar texto formatado com os dados do clube"
          >
            {#if copied}
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-emerald-400 font-bold">Diagnóstico Copiado!</span>
            {:else}
              <Copy class="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar Resumo</span>
            {/if}
          </button>

          <button
            type="button"
            on:click={shareWhatsApp}
            class="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium"
            title="Compartilhar no WhatsApp"
          >
            <Send class="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            on:click={shareTwitter}
            class="px-3 py-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-300 hover:text-sky-200 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium"
            title="Compartilhar no X (Twitter)"
          >
            <span class="font-bold font-mono">𝕏</span>
            <span>Postar</span>
          </button>
        </div>
      </div>

    </div>
  {/if}

  <!-- Social Share Card Generator Modal -->
  <SocialShareCardModal
    bind:isOpen={showShareModal}
    club={selectedClub}
    details={currentClubDetails}
    {estadosMap}
  />

</section>
