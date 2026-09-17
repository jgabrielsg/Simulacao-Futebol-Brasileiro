<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { base } from '$app/paths';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import {
    BookOpen, GraduationCap, Calendar, User, ExternalLink, Github,
    Compass, ArrowUpRight, Shield, Award, MapPin, BarChart3, Clock,
    Layers, Activity, Bus, Plane, Trophy, CheckCircle2,
    TrendingDown, DollarSign, Search, ArrowUpDown, Filter, Database,
    Loader2, ChevronDown, Scale, Globe, Route, Info, AlertTriangle,
    Check, ArrowRight, Table2, Cpu, GitBranch,
    ZoomIn, ZoomOut, X
  } from 'lucide-svelte';

  const basePath = base ? base.replace(/\/$/, '') : '';

  const tocItems = [
    { id: 'problema', label: '1. O Problema & Vazio de Calendário' },
    { id: 'dados', label: '2. Engenharia de Dados & Redes' },
    { id: 'pagerank', label: '3. Prestígio Esportivo & PageRank' },
    { id: 'piramide', label: '4. Arquitetura 244 & Invariância' },
    { id: 'zoneamento', label: '5. Zoneamento Espacial: Séries C e D' },
    { id: 'escalonamento', label: '6. Escalonamento Otimizado (TTP-k)' },
    { id: 'logistica', label: '7. Engenharia Multimodal & Custos' },
    { id: 'laboratorio', label: '8. Laboratório & Reprodutibilidade' }
  ];

  let activeSection = 'problema';

  function scrollToSection(id) {
    activeSection = id;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // Pure KaTeX Rendering Helper (SSR and client safe)
  function renderMath(latex, displayMode = true) {
    try {
      return katex.renderToString(latex, { displayMode, throwOnError: false });
    } catch (e) {
      return `<code class="text-rose-400 font-mono">${latex}</code>`;
    }
  }

  // Mathematical Formulation Strings (LaTeX)
  const fPageRank = '\\mathbf{PR} = \\alpha \\mathbf{M} \\mathbf{PR} + \\frac{1 - \\alpha}{|V|} \\mathbf{e}';
  const fResidual = '\\mathbf{PR}_{\\text{Residual}}(u) = \\sum_{c \\in \\text{Candidatos D}(u)} \\mathbf{PR}(c) = \\mathbf{PR}_{\\text{Estadual Total}}(u) - \\sum_{c \\in \\text{Séries A, B, C}(u)} \\mathbf{PR}(c)';
  const fElevador = '\\Delta K_r = \\text{Acessos}_r - \\text{Descensos}_r = 2 - 2 = 0, \\quad \\forall r \\in \\{\\text{Sul-MS, Sudeste, Nordeste, Norte-Centro}\\}';
  const fFederativa = '\\text{Vagas via Estadual}(u) = \\text{Cota}(u) - \\text{Rebaixados da Série C da UF}(u)';
  const fNoRepeat = '|r(u, v) - r(v, u)| \\ge 2, \\quad \\forall (u, v) \\in E';
  const fTurneCPSAT = 'C_{\\text{turnê}} = \\min \\left( \\sum_{i=1}^k C(u, v_i), \\;\\; \\frac{C(u, v_1)}{2} + \\sum_{i=1}^{k-1} C_{\\text{transição}}(v_i, v_{i+1}) + \\frac{C(u, v_k)}{2} \\right)';
  const fOverride = '\\left( T_{\\text{porta-a-porta aéreo}} \\ge T_{\\text{rodoviário}} \\right) \\;\\lor\\; \\left( D_{\\text{rod}} \\le 500\\text{ km (Série C)} \\;\\lor\\; D_{\\text{rod}} \\le 700\\text{ km (Série D)} \\right) \\implies \\mathbf{MODAL = ÔNIBUS}';
  const fDetourRatio = '\\text{Detour Ratio}(u, v) = \\frac{D_{\\text{rede ANAC}}(u, v)}{D_{\\text{geodésica}}(u, v)}';
  const fBateVolta = 'C_{\\text{viagem}} = (D_{\\text{rod}} \\times 40{,}00) + 4.800{,}00';
  const fOnibus = 'C_{\\text{viagem}} = (D_{\\text{rod}} \\times 40{,}00) + 25.000{,}00';
  const fAereo = 'C_{\\text{viagem}} = 40.000{,}00 + (D_{\\text{voo}} \\times 45{,}00) + (D_{\\text{hub\\_origem}} + D_{\\text{hub\\_destino}}) \\times 40{,}00 + 35.000{,}00';

  // ─── PageRank Analytics State ───
  let prData = null;
  let prLoading = true;
  let prError = null;

  // Club table filters
  let clubeSearch = '';
  let clubeUfFilter = 'TODAS';
  let clubeDivisaoFilter = 'TODAS';
  let clubeSortKey = 'rank';
  let clubeSortDir = 'asc';
  let clubeShowCount = 50;

  // Estado table sort
  let estadoSortKey = 'vagas_canonicas_serie_d';
  let estadoSortDir = 'desc';

  onMount(async () => {
    try {
      const res = await fetch(`${basePath}/json/pagerank_analytics.json`);
      if (!res.ok) throw new Error('Erro ao carregar pagerank_analytics.json');
      prData = await res.json();
      prLoading = false;
    } catch (err) {
      prError = err.message;
      prLoading = false;
    }
  });

  $: allUfs = prData?.clubes ? [...new Set(prData.clubes.map(c => c.uf))].sort() : [];
  $: allDivisoes = prData?.clubes ? [...new Set(prData.clubes.map(c => c.divisao))].sort() : [];

  $: filteredClubes = (() => {
    if (!prData?.clubes) return [];
    let list = prData.clubes;
    if (clubeUfFilter !== 'TODAS') list = list.filter(c => c.uf === clubeUfFilter);
    if (clubeDivisaoFilter !== 'TODAS') list = list.filter(c => c.divisao === clubeDivisaoFilter);
    if (clubeSearch.trim()) {
      const q = clubeSearch.toLowerCase().trim();
      list = list.filter(c =>
        c.clube.toLowerCase().includes(q) ||
        c.cidade?.toLowerCase().includes(q) ||
        c.uf.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let va = a[clubeSortKey];
      let vb = b[clubeSortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return clubeSortDir === 'asc' ? -1 : 1;
      if (va > vb) return clubeSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  })();

  $: displayedClubes = filteredClubes.slice(0, clubeShowCount);

  $: totalPrFiltrado = filteredClubes.reduce((acc, c) => acc + (c.pagerank_score || 0), 0);

  function getShareFiltrado(c) {
    if (!totalPrFiltrado || totalPrFiltrado === 0) return 0;
    return (c.pagerank_score / totalPrFiltrado) * 100;
  }

  $: sortedEstados = (() => {
    if (!prData?.estados) return [];
    let list = [...prData.estados];
    list.sort((a, b) => {
      let va = a[estadoSortKey];
      let vb = b[estadoSortKey];
      if (estadoSortKey === 'delta_residual') {
        va = a.vagas_canonicas_serie_d - a.vagas_esperadas_pr_residual;
        vb = b.vagas_canonicas_serie_d - b.vagas_esperadas_pr_residual;
      } else if (estadoSortKey === 'clubes_abc') {
        va = (a.clubes_serie_a || 0) + (a.clubes_serie_b || 0) + (a.clubes_serie_c || 0);
        vb = (b.clubes_serie_a || 0) + (b.clubes_serie_b || 0) + (b.clubes_serie_c || 0);
      }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return estadoSortDir === 'asc' ? -1 : 1;
      if (va > vb) return estadoSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  })();

  function handleClubSort(key) {
    if (clubeSortKey === key) {
      clubeSortDir = clubeSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      clubeSortKey = key;
      clubeSortDir = key === 'rank' ? 'asc' : 'desc';
    }
  }

  function handleEstadoSort(key) {
    if (estadoSortKey === key) {
      estadoSortDir = estadoSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      estadoSortKey = key;
      estadoSortDir = (key === 'uf' || key === 'nome' || key === 'macro_regiao') ? 'asc' : 'desc';
    }
  }

  function loadMoreClubes() {
    clubeShowCount = Math.min(clubeShowCount + 50, filteredClubes.length);
  }

  function fmtPR(val) {
    if (val == null) return '—';
    return (val * 100).toFixed(4) + '%';
  }

  function fmtNum(val, dec = 2) {
    if (val == null) return '—';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function divisaoBadgeClass(div) {
    if (!div) return 'bg-slate-800 text-slate-400 border-slate-700';
    if (div.includes('Série A')) return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    if (div.includes('Série B')) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    if (div.includes('Série C')) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20';
    if (div.includes('Série D')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  }

  // ─── Image Zoom / Lightbox Modal State ───
  let zoomedImage = null; // { src, alt, caption }
  let zoomScale = 1; // 1 to 3.0
  let scrollContainer = null;
  let imgElement = null;
  let containerWidth = 0;
  let containerHeight = 0;
  let naturalWidth = 0;
  let naturalHeight = 0;

  // Drag-to-pan state
  let isDragging = false;
  let hasDragged = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let scrollStartLeft = 0;
  let scrollStartTop = 0;

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });

  function openZoom(src, alt, caption) {
    zoomedImage = { src, alt, caption };
    zoomScale = 1;
    naturalWidth = 0;
    naturalHeight = 0;
    hasDragged = false;
    isDragging = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  function closeZoom() {
    zoomedImage = null;
    zoomScale = 1;
    hasDragged = false;
    isDragging = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  function handleImageLoad(e) {
    naturalWidth = e.currentTarget.naturalWidth || 6000;
    naturalHeight = e.currentTarget.naturalHeight || 4000;
  }

  $: baseFitWidth = (() => {
    const w = containerWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const h = containerHeight || (typeof window !== 'undefined' ? window.innerHeight - 100 : 800);
    const padding = 64;
    const availW = Math.max(w - padding, 320);
    const availH = Math.max(h - padding, 320);
    if (!naturalWidth || !naturalHeight) {
      return Math.min(availW, 1200);
    }
    const ar = naturalWidth / naturalHeight;
    return Math.min(availW, availH * ar);
  })();

  $: currentImgWidth = Math.round(baseFitWidth * zoomScale);

  async function applyZoom(newScale) {
    newScale = Math.min(Math.max(Number(newScale.toFixed(2)), 1), 3.0);
    if (newScale === zoomScale) return;

    if (!scrollContainer) {
      zoomScale = newScale;
      return;
    }

    const oldWidth = currentImgWidth || 1000;
    const oldScrollLeft = scrollContainer.scrollLeft;
    const oldScrollTop = scrollContainer.scrollTop;
    const clientW = scrollContainer.clientWidth;
    const clientH = scrollContainer.clientHeight;

    const relX = (oldScrollLeft + clientW / 2) / oldWidth;
    const ar = naturalWidth && naturalHeight ? (naturalWidth / naturalHeight) : 1.77;
    const oldHeight = oldWidth / ar;
    const relY = (oldScrollTop + clientH / 2) / oldHeight;

    zoomScale = newScale;
    await tick();

    if (zoomScale === 1) {
      scrollContainer.scrollLeft = 0;
      scrollContainer.scrollTop = 0;
    } else {
      const newWidth = currentImgWidth;
      const newHeight = newWidth / ar;
      scrollContainer.scrollLeft = Math.max(0, relX * newWidth - clientW / 2);
      scrollContainer.scrollTop = Math.max(0, relY * newHeight - clientH / 2);
    }
  }

  function handleZoomIn(e) {
    if (e) e.stopPropagation();
    applyZoom(zoomScale + 0.35);
  }

  function handleZoomOut(e) {
    if (e) e.stopPropagation();
    applyZoom(zoomScale - 0.35);
  }

  function handleResetZoom(e) {
    if (e) e.stopPropagation();
    applyZoom(1);
  }

  function handleImageClick(e) {
    e.stopPropagation();
    if (hasDragged) {
      hasDragged = false;
      return;
    }
    if (zoomScale === 1) {
      applyZoom(1.8);
    } else {
      applyZoom(1);
    }
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return; // Left click only
    isDragging = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    if (scrollContainer) {
      scrollStartLeft = scrollContainer.scrollLeft;
      scrollStartTop = scrollContainer.scrollTop;
    }
  }

  function handleMouseMove(e) {
    if (!isDragging || !scrollContainer) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDragged = true;
    }
    if (hasDragged) {
      scrollContainer.scrollLeft = scrollStartLeft - dx;
      scrollContainer.scrollTop = scrollStartTop - dy;
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleBackdropClick(e) {
    if (hasDragged) {
      hasDragged = false;
      return;
    }
    if (e.target === scrollContainer || e.target.classList.contains('zoom-backdrop-target')) {
      closeZoom();
    }
  }

  function handleWheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      applyZoom(zoomScale + delta);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && zoomedImage) {
      closeZoom();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
  <title>Metodologia e Ciência: A Nova Pirâmide do Futebol Brasileiro</title>
  <meta name="description" content="Fundamentação matemática, Pesquisa Operacional, Teoria dos Grafos e Otimização Combinatória da Nova Pirâmide do Futebol Brasileiro." />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950 font-sans">
  <Navbar />

  <!-- MOBILE TOC HORIZONTAL SCROLLER (Sticky under Navbar on mobile/tablet) -->
  <div class="lg:hidden sticky top-16 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shadow-md">
    {#each tocItems as item}
      <button
        on:click={() => scrollToSection(item.id)}
        class={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          activeSection === item.id
            ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex flex-col lg:flex-row gap-10 items-start relative">

      <!-- STICKY SIDEBAR TABLE OF CONTENTS -->
      <aside class="hidden lg:block w-72 shrink-0 sticky top-24 self-start bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-xl">
        <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-3 mb-3">
          <BookOpen class="w-4 h-4" />
          Sumário do Dossiê Metodológico
        </div>
        <nav class="space-y-1 text-xs font-medium">
          {#each tocItems as item}
            <button
              on:click={() => scrollToSection(item.id)}
              class={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                activeSection === item.id
                  ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span class="truncate">{item.label}</span>
            </button>
          {/each}
        </nav>

        <div class="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
          <p class="font-semibold text-slate-400">Trabalho de Conclusão de Curso (2026)</p>
          <p>Ciência de Dados & Pesquisa Operacional</p>
          <p>Licença Acadêmica Aberta (MIT)</p>
        </div>
      </aside>

      <!-- EDITORIAL CONTENT (COLUMN LAYOUT MAX-W-4XL) -->
      <article class="flex-1 max-w-4xl space-y-16 leading-relaxed text-slate-300 text-sm sm:text-base">

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 1: O PROBLEMA & O PARADOXO CONTINENTAL -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="problema" class="space-y-6 scroll-mt-24">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase">
            <GraduationCap class="w-4 h-4" />
            Trabalho de Conclusão de Curso (TCC) — 2026
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Fundamentação Científica: Pesquisa Operacional, Teoria dos Grafos e Otimização Combinatória no Futebol Brasileiro
          </h1>

          <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Uma formulação estrita de modelagem matemática e otimização em redes para reestruturar as divisões de acesso do futebol nacional, assegurando <strong>244 agremiações em atividade simultânea regular</strong> sob subsídio logístico sustentável da CBF.
          </p>

          <!-- Credenciais Acadêmicas Neutras -->
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span class="text-slate-500 font-bold uppercase text-[10px] block">Pesquisador</span>
              <span class="font-bold text-white text-sm">João Gabriel Machado</span>
              <span class="text-slate-400 text-[11px] block">Arroio do Sal — RS</span>
            </div>
            <div>
              <span class="text-slate-500 font-bold uppercase text-[10px] block">Formação</span>
              <span class="font-bold text-white text-sm">B.Sc. em Ciência de Dados</span>
              <span class="text-slate-400 text-[11px] block">Inteligência Artificial</span>
            </div>
            <div>
              <span class="text-slate-500 font-bold uppercase text-[10px] block">Área Temática</span>
              <span class="font-bold text-white text-sm">Pesquisa Operacional</span>
              <span class="text-slate-400 text-[11px] block">Teoria dos Grafos & CP-SAT</span>
            </div>
            <div>
              <span class="text-slate-500 font-bold uppercase text-[10px] block">Escopo da Modelagem</span>
              <span class="font-bold text-emerald-400 text-sm">244 Clubes / 27 UFs</span>
              <span class="text-slate-400 text-[11px] block">Subsídio Logístico CBF</span>
            </div>
          </div>

          <!-- O Abismo do Calendário Oficial -->
          <div class="space-y-4 pt-2">
            <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Clock class="w-5 h-5 text-indigo-400" />
              O Diagnóstico do Vazio de Calendário nas Séries C e D
            </h2>

            <p class="leading-relaxed">
              O sistema desportivo profissional brasileiro convive com uma anomalia estrutural crônica: a <strong>descontinuidade forçada de atividades</strong> para a esmagadora maioria de seus clubes. Enquanto as Séries A e B concentram os holofotes e receitas televisivas para 40 agremiações, as divisões de acesso organizadas pela Confederação Brasileira de Futebol (CBF) operam sob regulamentos que interrompem precocemente o calendário da base piramidal:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span class="font-bold text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                  <AlertTriangle class="w-3.5 h-3.5" /> O Gargalo da Série C Atual (20 Clubes)
                </span>
                <p class="text-slate-300 leading-relaxed">
                  Disputada em grupo único continental de 19 rodadas, a Série C assegura apenas <strong>19 partidas mínimas</strong> por equipe. Das 20 agremiações participantes, <strong>12 clubes (60%) são eliminados na 1ª fase em agosto</strong>, amargando 8 meses ininterruptos de ociosidade operacional até o ano subsequente, com rescisões contratuais compulsórias e demissões em massa de atletas e comissões técnicas.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span class="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                  <AlertTriangle class="w-3.5 h-3.5" /> O Gargalo da Série D Atual (96 Clubes)
                </span>
                <p class="text-slate-300 leading-relaxed">
                  Mesmo com a expansão oficial de 64 para 96 clubes em 2026, a 1ª fase (16 grupos de 6 equipes) oferece apenas <strong>10 partidas mínimas</strong> em turno e returno intra-grupo. Como consequência, <strong>32 agremiações (33,3% da competição) encerram suas atividades já em junho/julho</strong>, usufruindo de um calendário profissional ativo de menos de 3 meses em todo o ano.
                </p>
              </div>
            </div>

            <p class="leading-relaxed">
              Esse formato radial gera o chamado <strong>"Paradoxo Continental"</strong>: em um território de 8,51 milhões de km², a CBF subsidia passagens aéreas comerciais com múltiplas escalas e viagens isoladas de retorno à sede (bate-volta), gerando custos médios exorbitantes de até R$ 160.766,43 por confronto na Série C.
            </p>

            <div class="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 text-xs">
              <span class="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Shield class="w-4 h-4 text-indigo-400" /> A Missão Fundamental deste Trabalho
              </span>
              <p class="text-slate-200 leading-relaxed">
                Desenhar e validar matematicamente um novo sistema desportivo que:
                <strong>(1)</strong> Eleve o contingente em atividade plena para <strong>244 agremiações regulares</strong>;
                <strong>(2)</strong> Garanta um calendário perene de abril a novembro com <strong>26 a 34 partidas para a Série C</strong> e de <strong>10 a 18 partidas para a Série D</strong>; e
                <strong>(3)</strong> Mantenha o orçamento global de logística subsidiado pela CBF em equilíbrio fiscal estrito (variação líquida de apenas +5,5% em relação ao gasto real atual, mesmo saltando de 758 para 1.959 partidas oficiais no somatório das duas divisões).
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 2: ENGENHARIA DE DADOS & REDES ESPACIAIS -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="dados" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 1 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database class="w-6 h-6 text-indigo-400" />
              2. Engenharia de Dados: Coleta Multissetorial, Higienização e Redes Reais
            </h2>
          </div>

          <p class="leading-relaxed">
            Ao contrário de abordagens puramente teóricas ou baseadas em estimativas euclidianas em linha reta, este modelo foi integralmente edificado sobre dados empíricos auditados de partidas, malha aeroviária real e redes viárias rodoviárias.
          </p>

          <div class="space-y-4 text-xs">
            <!-- 2.1 Histórico de Partidas -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                  <Activity class="w-4 h-4 text-cyan-400" /> Histórico de Partidas e Competições (6 Temporadas Completas)
                </span>
                <span class="font-mono text-slate-500">2020 a 2025</span>
              </div>
              <p class="text-slate-300 leading-relaxed">
                Diante da inexistência de um banco de dados unificado para divisões inferiores, foram desenvolvidos pipelines de extração em Python/Selenium para coletar todas as partidas disputadas em seis temporadas consecutivas no Brasil. O conjunto de dados abrange:
              </p>
              <ul class="list-disc pl-5 text-slate-400 space-y-1">
                <li><strong>Competições Nacionais:</strong> Séries A, B, C e D do Campeonato Brasileiro e Copa do Brasil (integrados a partir de repositórios abertos auditados como <code class="text-slate-300">BrazilianFootball/Data</code>).</li>
                <li><strong>Competições Estaduais e Regionais:</strong> Primeiras divisões e divisões de acesso de todas as 27 Federações Estaduais (incluindo até a 5ª divisão em SP e a 3ª em GO/MG/RS), além de copas estaduais (Copa FGF, Copa Rio, etc.), extraídos e auditados via plataforma Ogol.</li>
                <li><strong>Higienização Canônica:</strong> Cada agremiação recebeu a chave primária imutável <code class="text-indigo-300">CLUBE/estado</code> (ex: <code class="text-slate-200">AMÉRICA/rio_grande_do_norte</code> vs. <code class="text-slate-200">AMERICA/rio_de_janeiro</code>), eliminando ambiguidades e homônimos entre 876 agremiações ativas.</li>
              </ul>
            </div>

            <!-- 2.2 Malha Aeroviária Real ANAC -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-white text-sm flex items-center gap-2">
                <Plane class="w-4 h-4 text-cyan-400" /> Malha Aeroviária Comercial Real (Microdados VRA da ANAC)
              </span>
              <p class="text-slate-300 leading-relaxed">
                Para evitar a falácia comum de assumir "voos em linha reta" entre cidades do interior sem aeroporto comercial, foram ingeridos os microdados dos <strong>Voos Regulares Ativos (VRA)</strong> da Agência Nacional de Aviação Civil (ANAC).
              </p>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 space-y-1">
                <p><strong>Filtro de Regularidade Comercial:</strong> Apenas rotas comerciais regulares com frequência comprovada de <strong>no mínimo 52 voos/ano</strong> (pelo menos 1 voo semanal homologado) foram incorporadas ao grafo aeroviário do <a href="https://malha-area-brasileira.netlify.app/" target="_blank" rel="noopener noreferrer">GeoFlight-BR</a>.</p>
                <p class="text-slate-400 text-[11px]">Rotas sazonais, voos executivos particulares e fretamentos aéreos fictícios foram sumariamente descartados. Toda viagem aérea é obrigatoriamente roteada a partir do aeroporto comercial mais próximo com voos regulares homologados.</p>
              </div>
            </div>

            <!-- 2.3 Malha Rodoviária e Geocodificação -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-white text-sm flex items-center gap-2">
                <Bus class="w-4 h-4 text-emerald-400" /> Geocodificação Espacial e Roteamento Rodoviário OSRM
              </span>
              <p class="text-slate-300 leading-relaxed">
                Todos os estádios e sedes dos 876 clubes foram geocodificados com coordenadas geodésicas exatas (latitude/longitude). As distâncias viárias e tempos de viagem terrestres foram calculados via <strong>OSRM (Open Source Routing Machine)</strong> sobre a malha asfáltica real do OpenStreetMap, aplicando um <strong>fator de tortuosidade calibrado de &tau; = 1,30</strong> sobre distâncias inferiores a 1.000 km para refletir o relevo e a sinuosidade das rodovias brasileiras.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 3: MODELAGEM DO GRAFO & PAGERANK      -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="pagerank" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 2 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy class="w-6 h-6 text-indigo-400" />
              3. Modelagem de Prestígio Esportivo: Grafos Direcionados & PageRank
            </h2>
          </div>

          <p class="leading-relaxed">
            Para alocar as vagas nacionais entre os estados e ordenar os 876 clubes de forma neutra, foi necessário criar uma métrica desportiva pura, imune a critérios arbitrários de tamanho de torcida ou relevância midiática. A solução adotada baseia-se na <strong>Teoria dos Grafos</strong> e no algoritmo <strong>PageRank</strong>.
          </p>

          <div class="space-y-4 text-xs">
            <!-- Estrutura do Grafo -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm">O Grafo Direcionado Ponderado G = (V, E)</h3>
              <p class="text-slate-300 leading-relaxed">
                O futebol brasileiro é modelado como um grafo direcionado onde os nós (V) representam os 876 clubes cadastrados e as arestas (E) representam as partidas disputadas:
              </p>
              <ul class="list-disc pl-5 text-slate-400 space-y-1.5">
                <li><strong>Direção do Fluxo de Prestígio:</strong> O prestígio não flui aleatoriamente; ele é direcionado <strong>do derrotado para o vencedor</strong> ((u 	o v) se (v) venceu (u)). Em caso de empate, o fluxo é simétrico e dividido igualmente. Quem vence drena autoridade desportiva do adversário.</li>
                <li><strong>Ponderação por Hierarquia de Competição ((w)):</strong> O volume de prestígio em disputa é calibrado pela relevância do torneio:
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <span class="p-2 rounded bg-slate-950 border border-slate-800 text-amber-300">Série A / C. do Brasil: w = 20</span>
                    <span class="p-2 rounded bg-slate-950 border border-slate-800 text-blue-300">Série B: w = 10</span>
                    <span class="p-2 rounded bg-slate-950 border border-slate-800 text-indigo-300">Série C: w = 5</span>
                    <span class="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-300">Série D: w = 3</span>
                  </div>
                  <span class="block text-slate-500 pt-1">Estaduais 1ª Divisão: w = 3 | 2ª Divisão: w = 2 | 3ª ou menos: w = 1</span>
                </li>
                <li><strong>Amortecimento Temporal (Half-life):</strong> Aplica-se um decaimento exponencial sobre o histórico de partidas para que campanhas recentes possuam peso substantivamente superior a vitórias de anos pretéritos.</li>
              </ul>
            </div>

            <!-- Equação KaTeX PageRank -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-white block text-sm">A Equação Canônica do PageRank Esportivo</span>
              <p class="text-slate-400 leading-relaxed">
                Com fator de amortecimento de teletransporte (&alpha; = 0,85) e vetor de probabilidade uniforme <strong>e</strong>:
              </p>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-indigo-300 text-xs overflow-x-auto">
                {@html renderMath(fPageRank)}
              </div>
            </div>

            <!-- PageRank Residual Estadual -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-emerald-400 block text-sm flex items-center gap-1.5">
                <Shield class="w-4 h-4" /> O Conceito de PageRank Residual Estadual
              </span>
              <p class="text-slate-300 leading-relaxed">
                Para alocar com justiça as vagas da Série D entre os estados, foi isolado o <strong>PageRank Residual</strong> de cada federação: desconta-se 100% da massa de prestígio dos clubes que já possuem vaga cativa nas Séries A, B e C, mensurando exclusivamente a força dos clubes que disputam as seletivas da Série D:
              </p>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-emerald-300 text-xs overflow-x-auto">
                {@html renderMath(fResidual)}
              </div>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 4: ARQUITETURA DA PIRÂMIDE 244        -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="piramide" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 3 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers class="w-6 h-6 text-indigo-400" />
              4. Arquitetura da Pirâmide Nacional: O Sistema dos 244 Clubes e Invariância Federativa
            </h2>
          </div>

          <p class="leading-relaxed">
            A estrutura piramidal proposta consolida <strong>244 agremiações em atividade simultânea regular</strong>, divididas em quatro escalões com fluxos de acesso e descenso geometricamente balanceados:
          </p>

          <!-- Imagem Oficial da Pirâmide -->
          <div class="space-y-2">
            <button
              type="button"
              class="w-full text-left relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              on:click={() => openZoom(
                `${basePath}/plots/pyramid_tabular_flowchart.png`,
                'Pirâmide Tabular 244 Clubes do Futebol Brasileiro',
                'Figura 1: Arquitetura da Pirâmide Nacional dos 244 Clubes (Séries A, B, C e D) e suas conexões federativas.'
              )}
            >
              <img
                src="{basePath}/plots/pyramid_tabular_flowchart.png"
                alt="Pirâmide Tabular 244 Clubes do Futebol Brasileiro"
                class="w-full object-cover group-hover:scale-[1.01] transition duration-300"
              />
              <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition shadow-md">
                <ZoomIn class="w-3.5 h-3.5 text-indigo-400" />
                <span>Clique para aproximar</span>
              </div>
            </button>
            <span class="text-[11px] text-slate-500 block text-center">
              Figura 1: Arquitetura da Pirâmide Nacional dos 244 Clubes (Séries A, B, C e D) e suas conexões federativas.
            </span>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Cotas da Série D e Teto Antitruste -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm">Distribuição das 144 Vagas da Série D e o Teto Antitruste</h3>
              <p class="text-slate-300 leading-relaxed">
                As 144 vagas da Série D são distribuídas entre as quatro macrorregiões desportivas com base no PageRank Residual de cada estado, respeitando a seguinte partição canônica:
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Sul-MS</span>
                  <span class="font-bold text-white text-sm">32 vagas</span>
                  <span class="text-slate-500 text-[10px]">4 Ligas de 8</span>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Sudeste</span>
                  <span class="font-bold text-white text-sm">36 vagas</span>
                  <span class="text-amber-400 text-[10px]">Teto Antitruste</span>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Nordeste</span>
                  <span class="font-bold text-white text-sm">36 vagas</span>
                  <span class="text-slate-500 text-[10px]">4 Ligas de 8 a 10</span>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Norte-Centro</span>
                  <span class="font-bold text-white text-sm">40 vagas</span>
                  <span class="text-cyan-400 text-[10px]">6 Corredores Canônicos</span>
                </div>
              </div>
              <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-300 space-y-1">
                <span class="font-bold text-amber-300 block">Justificativa do Teto Regulatório Antitruste do Sudeste (36 Vagas):</span>
                <p class="leading-relaxed">
                  Pela densidade bruta de clubes com alto PageRank Residual em São Paulo, Rio de Janeiro e Minas Gerais, o Sudeste teria direito estritamente matemático a mais de 50 vagas na Série D. No entanto, para evitar a hegemonia predatória dos polos mais ricos e proteger a diversidade desportiva nacional, estabeleceu-se um <strong>teto regulatório antitruste de 36 vagas</strong>, redistribuindo o excedente residual para viabilizar as conferências do Norte, Centro-Oeste e Nordeste.
                </p>
              </div>
            </div>

            <!-- Princípio do Elevador e Invariância Federativa -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span class="font-bold text-white block text-sm flex items-center gap-1.5">
                  <Scale class="w-4 h-4 text-indigo-400" /> O Princípio do Elevador Fechado
                </span>
                <p class="text-slate-300 leading-relaxed">
                  Para que a distribuição de vagas regionais não sofra colapsos com acessos e descensos, impõe-se a invariância de fluxo (&Delta;K<sub>r</sub> = 0):
                </p>
                <div class="p-2 rounded bg-slate-950 border border-slate-800 text-center text-indigo-300 text-[11px] overflow-x-auto">
                  {@html renderMath(fElevador)}
                </div>
                <p class="text-slate-400 text-[11px] leading-relaxed">
                  Exatamente 2 clubes sobem da Série D para a Série C por macrorregião, e exatamente 2 caem da Série C para a D na mesma macrorregião. Isso mantém o tamanho das conferências perfeitamente conservado ano após ano.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span class="font-bold text-white block text-sm flex items-center gap-1.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400" /> Equação de Invariância Federativa
                </span>
                <p class="text-slate-300 leading-relaxed">
                  A nível estadual, a conservação das vagas de seletivas estaduais é regida pela equação canônica:
                </p>
                <div class="p-2 rounded bg-slate-950 border border-slate-800 text-center text-emerald-300 text-[11px] overflow-x-auto">
                  {@html renderMath(fFederativa)}
                </div>
                <p class="text-slate-400 text-[11px] leading-relaxed">
                  Se um clube de uma UF for rebaixado da Série C, sua federação consome a vaga de acesso direto, garantindo que o número total de 144 agremiações na Série D permaneça constante e rigorosamente protegido.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 5: ZONEAMENTO ESPACIAL: C E D         -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="zoneamento" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 4 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin class="w-6 h-6 text-indigo-400" />
              5. Zoneamento Espacial: Algoritmos de Agrupamento das Séries C e D
            </h2>
          </div>

          <p class="leading-relaxed">
            A regionalização das competições segue uma <strong>causalidade hierárquica estrita</strong>: a Série C é resolvida primeiro, pois suas 4 Conferências Regionais delimitam os quadrantes macro do território nacional. Somente após a fixação dos 60 clubes da C é que os 144 clubes da Série D são particionados em 18 Ligas Regionais.
          </p>

          <!-- Imagem Oficial do Mapa Macro -->
          <div class="space-y-2">
            <button
              type="button"
              class="w-full text-left relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              on:click={() => openZoom(
                `${basePath}/plots/mapa_estatico_ligas_cd.png`,
                'Zoneamento Geoespacial das Séries C e D do Futebol Brasileiro',
                'Figura 2: Zoneamento espacial das 4 Macro-Conferências da Série C e das 18 Ligas Regionais Otimizadas da Série D.'
              )}
            >
              <img
                src="{basePath}/plots/mapa_estatico_ligas_cd.png"
                alt="Zoneamento Geoespacial das Séries C e D do Futebol Brasileiro"
                class="w-full object-cover group-hover:scale-[1.01] transition duration-300"
              />
              <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition shadow-md">
                <ZoomIn class="w-3.5 h-3.5 text-indigo-400" />
                <span>Clique para aproximar</span>
              </div>
            </button>
            <span class="text-[11px] text-slate-500 block text-center">
              Figura 2: Zoneamento espacial das 4 Macro-Conferências da Série C e das 18 Ligas Regionais Otimizadas da Série D.
            </span>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Série C: 4 Conferências Regionais -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                Série C (60 Clubes): 4 Conferências Regionais Contíguas
              </h3>
              <p class="text-slate-300 leading-relaxed">
                Organizada em 4 blocos compactos com disputa em turno e returno completos (garantindo 26 a 30 rodadas regulares):
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-white">Conferência Sudeste: 16 clubes</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-white">Conferência Nordeste: 16 clubes</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-white">Conferência Sul-MS: 14 clubes</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-white">Conferência Norte-Centro: 14 clubes</span>
              </div>
            </div>

            <!-- Série D: 6 Blindadas vs 12 Otimizadas -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Série D (144 Clubes): Zoneamento Heurístico vs. Otimização CP-SAT
              </h3>
              <p class="text-slate-300 leading-relaxed">
                A conformação das 18 Ligas Regionais da Série D exigiu uma abordagem híbrida de alta sofisticação computacional e geográfica:
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div class="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                  <span class="font-bold text-cyan-300 block text-xs">As 6 Ligas do Norte-Centro: Corredores Canônicos Blindados</span>
                  <p class="text-slate-300 leading-relaxed text-[11px]">
                    Na região Norte e Centro-Oeste, a infraestrutura viária é fragmentada por bacias fluviais amazônicas, trechos não asfaltados e ausência de travessias terrestres regulares. Por isso, <strong>as 6 Ligas do Norte-Centro precisaram ser pré-definidas heuristicamente</strong> (4 de 6 clubes e 2 de 8 clubes), blindando corredores logísticos específicos (como o Eixo Calha do Amazonas, Eixo Belém-Brasília e Eixo Pantanal) para evitar que clubes ficassem ilhados sem conectividade viária ou fluvial.
                  </p>
                </div>

                <div class="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                  <span class="font-bold text-emerald-300 block text-xs">As Demais 12 Ligas: Clusterização Dinâmica CP-SAT</span>
                  <p class="text-slate-300 leading-relaxed text-[11px]">
                    No Sul-MS (4 ligas), Sudeste (4 ligas) e Nordeste (4 ligas), onde a malha asfáltica é densa e interligada, a divisão dos clubes foi gerada por <strong>otimização matemática pura via CP-SAT Bounded-Radius Medoids</strong>. O solver minimizou a soma das distâncias terrestres reais, aplicando a restrição de clubes iso-liga de fronteira para respeitar o teto de 650 km em viagens rodoviárias.
                  </p>
                </div>
              </div>
            </div>

            <!-- Destaque dos Clubes Iso-Liga de Fronteira -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Mecanismo de Elasticidade: Os 11 Clubes Iso-Liga de Fronteira
              </h3>
              <p class="text-slate-300 leading-relaxed">
                Para absorver promoções e rebaixamentos ao longo dos ciclos quinquenais sem quebrar a contiguidade das conferências, o modelo identifica agremiações situadas em faixas de fronteira interestadual com custos de deslocamento similares para dois quadrantes vizinhos.
              </p>
              <div class="space-y-2 pt-1">
                <button
                  type="button"
                  class="w-full text-left relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  on:click={() => openZoom(
                    `${basePath}/plots/mapa_estatico_isoligas.png`,
                    'Mapa de Clubes Iso-Liga e Polígonos Convexos',
                    'Figura 3: Identificação geoespacial dos 11 pivôs de fronteira (clubes iso-liga) e envoltórias convexas.'
                  )}
                >
                  <img
                    src="{basePath}/plots/mapa_estatico_isoligas.png"
                    alt="Mapa de Clubes Iso-Liga e Polígonos Convexos"
                    class="w-full object-cover group-hover:scale-[1.01] transition duration-300"
                  />
                  <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition shadow-md">
                    <ZoomIn class="w-3.5 h-3.5 text-indigo-400" />
                    <span>Clique para aproximar</span>
                  </div>
                </button>
                <span class="text-[11px] text-slate-500 block text-center">
                  Figura 3: Identificação geoespacial dos 11 pivôs de fronteira (<em>clubes iso-liga</em>) e envoltórias convexas.
                </span>
              </div>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 6: ESCALONAMENTO OTIMIZADO (TTP-k)    -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="escalonamento" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 5 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu class="w-6 h-6 text-indigo-400" />
              6. Escalonamento Otimizado: Travelling Tournament Problem (TTP-k com CP-SAT)
            </h2>
          </div>

          <p class="leading-relaxed">
            Uma vez definidos os grupos das conferências e ligas, o desafio central passa a ser o agendamento temporal das partidas. Resolver a tabela de um torneio esportivo com minimização de deslocamentos é uma instância clássica e NP-difícil do <strong>Travelling Tournament Problem (TTP)</strong>.
          </p>

          <div class="space-y-4 text-xs">
            <!-- Modelo Unmirrored e Restrições -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm">O Modelo Unmirrored 2DRR (Duplo Turno Livre Não-Espelhado)</h3>
              <p class="text-slate-300 leading-relaxed">
                Em vez de utilizar tabelas espelhadas arcaicas (onde a rodada <em>R + n</em> é idêntica à rodada <em>R</em> apenas invertendo o mando), adotou-se o modelo <strong>Unmirrored 2DRR</strong>. Isso permite que a ordem dos confrontos seja completamente reorganizada no returno para maximizar o encadeamento de jogos consecutivos fora de casa.
              </p>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span class="font-bold text-white block">Restrição Canônica No-Repeat:</span>
                <p class="text-slate-400">Nenhum par de clubes pode se enfrentar em rodadas consecutivas:</p>
                <div class="text-center text-cyan-300 py-1 font-mono overflow-x-auto">
                  {@html renderMath(fNoRepeat)}
                </div>
              </div>
            </div>

            <!-- Limites TTP-k e Economia por Turnês -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <Route class="w-4 h-4 text-cyan-400" />
                Limites Regionais de Turnê (TTP-k) e Encadeamento de Viagens
              </h3>
              <p class="text-slate-300 leading-relaxed">
                Para evitar viagens de bate-volta sucessivas à sede, o modelo agrupa de 2 a 6 jogos fora consecutivos. Os limites máximos de turnê (<em>k</em>) foram calibrados com base na extensão territorial de cada região:
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">Sudeste: TTP-4</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">Sul-MS: TTP-5</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">Nordeste: TTP-5</span>
                <span class="p-2 rounded bg-slate-950 border border-slate-800 text-amber-300">Norte-Centro: TTP-6</span>
              </div>
              <p class="text-slate-400 text-[11px] leading-relaxed">
                Nas ligas de 6 agremiações, adota-se TTP-3; nas de 8 e 10 equipes, adota-se TTP-4. A função de custo de turnê compara o deslocamento radial clássico com o trajeto triangular encadeado:
              </p>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-emerald-300 text-xs overflow-x-auto">
                {@html renderMath(fTurneCPSAT)}
              </div>
              <div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                Resultado Comprovado: R$ 31,14 milhões economizados anualmente em comparação com o modelo bate-volta isolado da CBF.
              </div>
            </div>

            <!-- Motor de Otimização -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-white block text-sm flex items-center gap-1.5">
                <Cpu class="w-4 h-4 text-indigo-400" /> Motor Computacional: Warm-Start Berger + LNS CP-SAT
              </span>
              <p class="text-slate-300 leading-relaxed">
                O escalonador utiliza o <strong>Google OR-Tools CP-SAT</strong> com uma estratégia híbrida em dois estágios:
                <strong>(1) Warm-Start Poligonal de Berger:</strong> Inicialização determinística em menos de 0,01 segundo garantindo tabelas 100% factíveis; e
                <strong>(2) Large Neighborhood Search (LNS):</strong> Busca local com janelas deslizantes (*Sliding Window Exchange* de 4 a 6 rodadas) para otimizar continuamente a alternância de mandos e o descanso entre viagens.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 7: ENGENHARIA MULTIMODAL & CUSTOS     -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="logistica" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 6 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign class="w-6 h-6 text-indigo-400" />
              7. Engenharia Multimodal, Função de Custos Reais & Simulação de Monte Carlo
            </h2>
          </div>

          <p class="leading-relaxed">
            Para que os resultados possuam validade executiva perante os órgãos de governança desportiva, cada deslocamento foi precificado com base nas <strong>tabelas reais de subsídio corporativo da CBF</strong>, considerando transporte, hospedagem e alimentação para delegações padronizadas de 32 passageiros.
          </p>

          <div class="space-y-4 text-xs">
            <!-- Limiares Fisiológicos e Decisão Modal -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm">O Limiar Fisiológico e a Regra de Decisão Modal</h3>
              <p class="text-slate-300 leading-relaxed">
                A escolha entre ônibus leito fretado e avião obedece a um teto fisiológico estrito de <strong>15 horas de permanência em trânsito</strong> e aos seguintes limiares de distância viária:
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Série C</span>
                  <span class="font-bold text-white text-sm">Até 500 km</span>
                  <span class="text-emerald-400 text-[10px]">Ônibus leito fretado mandatório</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="text-slate-500 block text-[10px]">Série D</span>
                  <span class="font-bold text-white text-sm">Até 700 km</span>
                  <span class="text-emerald-400 text-[10px]">Ônibus leito fretado mandatório</span>
                </div>
              </div>
              <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span class="font-bold text-white block">Regra do Tempo Porta-a-Porta e Detour Ratio:</span>
                <p class="text-slate-400 text-[11px] leading-relaxed">
                  Mesmo acima de 700 km, se o tempo total de viagem aérea (deslocamento ao aeroporto mais próximo + espera de check-in + voo + escalas de conexão comercial + traslado ao hotel de destino) for superior ao tempo de viagem em rodovia duplicada, o modal terrestre é selecionado automaticamente:
                </p>
                <div class="text-center text-cyan-300 py-1 overflow-x-auto">
                  {@html renderMath(fOverride)}
                </div>
              </div>
            </div>

            <!-- Equações Reais de Custo CBF -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 class="font-bold text-white text-sm">Equações Auditadas de Custo Operacional CBF</h3>
              <p class="text-slate-300 leading-relaxed">
                As três funções canônicas de custo logístico por confronto consideram diárias de hotel corporativo, alimentação integral e locação de frotas para delegações de 32 integrantes:
              </p>
              <div class="space-y-2">
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="font-bold text-emerald-400 block text-[11px] mb-1">1. Bate-Volta Local Curto (&lt; 200 km) — Apenas Refeições e Ônibus Local:</span>
                  <div class="text-center text-emerald-300 overflow-x-auto">
                    {@html renderMath(fBateVolta)}
                  </div>
                </div>
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="font-bold text-emerald-400 block text-[11px] mb-1">2. Viagem Terrestre Plena (&gt; 200 km) — Ônibus Leito + 2 Diárias de Hotel:</span>
                  <div class="text-center text-emerald-300 overflow-x-auto">
                    {@html renderMath(fOnibus)}
                  </div>
                </div>
                <div class="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span class="font-bold text-cyan-400 block text-[11px] mb-1">3. Viagem Aérea Comercial — Passagens Aéreas com Bagagem Pesada + Traslados Hub + Hotel:</span>
                  <div class="text-center text-cyan-300 overflow-x-auto">
                    {@html renderMath(fAereo)}
                  </div>
                </div>
              </div>
            </div>

            <!-- Validação por Monte Carlo -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span class="font-bold text-white block text-sm flex items-center gap-1.5">
                <Activity class="w-4 h-4 text-indigo-400" /> Validação Estocástica por Simulação de Monte Carlo
              </span>
              <p class="text-slate-300 leading-relaxed">
                Como os cruzamentos eliminatórios das fases finais (playoffs de acesso e semifinais) dependem do desempenho desportivo ao longo da temporada, foram rodadas <strong>10.000 iterações estocásticas de Monte Carlo</strong>. Isso permitiu prever os custos logísticos médios esperados para a CBF com intervalo de confiança de 95%, comprovando a solidez fiscal do sistema mesmo sob as chaves eliminatórias mais distantes.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEÇÃO 8: LABORATÓRIO & REPRODUTIBILIDADE    -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="laboratorio" class="space-y-6 scroll-mt-24">
          <div class="space-y-2">
            <span class="text-xl font-mono uppercase tracking-wider text-indigo-400 font-bold">Etapa 7 do Pipeline</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 class="w-6 h-6 text-indigo-400" />
              8. Laboratório Interativo de Dados & Reprodutibilidade Aberta
            </h2>
          </div>

          <p class="leading-relaxed">
            Consulte abaixo os resultados computados do modelo para os <strong>876 clubes auditados</strong> e para as <strong>27 Unidades da Federação</strong>, demonstrando a distribuição precisa de cotas, participações de prestígio e balanços de PageRank Residual.
          </p>

          {#if prLoading}
            <div class="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 class="w-8 h-8 text-indigo-400 animate-spin" />
              <p class="text-xs text-slate-400 font-mono">Carregando matriz analítica de PageRank (876 clubes)...</p>
            </div>
          {:else if prError}
            <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              Erro ao carregar dados do laboratório: {prError}
            </div>
          {:else if prData}
            <!-- Cards de Metadados -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-500 uppercase block">Total de Clubes</span>
                <span class="text-base font-bold text-white">{prData.meta?.total_clubes_mapeados || prData.clubes?.length || 876}</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-500 uppercase block">UFs Auditadas</span>
                <span class="text-base font-bold text-white">{prData.meta?.total_ufs || prData.estados?.length || 27} (100%)</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-500 uppercase block">Damping Factor</span>
                <span class="text-base font-bold text-indigo-400">&alpha; = 0,85</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-500 uppercase block">Ano-Base</span>
                <span class="text-base font-bold text-emerald-400">{prData.meta?.ano_base || 2026}</span>
              </div>
            </div>

            <!-- TABELA 1: RANKING DE CLUBES (876) -->
            <div class="space-y-4 pt-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Trophy class="w-4 h-4 text-amber-400" />
                  Ranking Nacional de PageRank (876 Clubes)
                </h3>
                <span class="text-xs text-slate-400 font-mono">
                  {filteredClubes.length} agremiações no recorte ativo
                </span>
              </div>

              <!-- Controls / Filters -->
              <div class="flex flex-wrap items-center gap-3">
                <div class="relative flex-1 min-w-[200px]">
                  <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar clube, cidade ou UF..."
                    bind:value={clubeSearch}
                    class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  bind:value={clubeUfFilter}
                  class="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TODAS">Todas as UFs (27)</option>
                  {#each allUfs as uf}
                    <option value={uf}>{uf}</option>
                  {/each}
                </select>

                <select
                  bind:value={clubeDivisaoFilter}
                  class="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TODAS">Todas as Divisões</option>
                  {#each allDivisoes as div}
                    <option value={div}>{div}</option>
                  {/each}
                </select>
              </div>

              <!-- Club Table -->
              <div class="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
                <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="sticky top-0 bg-slate-950 border-b border-slate-800 z-10">
                      <tr class="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th class="py-3 px-3 cursor-pointer hover:text-white w-12 sticky left-0 z-20 bg-slate-950" on:click={() => handleClubSort('rank')}>
                          # <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white sticky left-12 z-20 bg-slate-950 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800 min-w-[140px]" on:click={() => handleClubSort('clube')}>
                          Clube (Identificador) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white w-14" on:click={() => handleClubSort('uf')}>
                          UF <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleClubSort('divisao')}>
                          Divisão <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleClubSort('liga')}>
                          Liga <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-right cursor-pointer hover:text-white" on:click={() => handleClubSort('pagerank_score')}>
                          PageRank Score <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-right cursor-pointer hover:text-white font-bold text-indigo-400" on:click={() => handleClubSort('pagerank_score')}>
                          Share no Filtro (%) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300">
                      {#each displayedClubes as c}
                        {@const shareFiltro = getShareFiltrado(c)}
                        <tr class="hover:bg-slate-800/40 transition font-mono">
                          <td class="py-2 px-3 text-slate-500 font-bold sticky left-0 z-10 bg-slate-950/95">{c.rank}</td>
                          <td class="py-2 px-3 font-sans font-semibold text-white sticky left-12 z-10 bg-slate-950/95 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800 min-w-[140px] truncate">
                            {c.clube} <span class="text-slate-500 text-xs font-mono font-normal">({c.uf})</span>
                          </td>
                          <td class="py-2 px-3 font-bold text-indigo-400">{c.uf}</td>
                          <td class="py-2 px-3 font-sans">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border {divisaoBadgeClass(c.divisao)}">
                              {c.divisao}
                            </span>
                          </td>
                          <td class="py-2 px-3 font-sans text-slate-400 text-[11px] max-w-[180px] truncate">{c.liga}</td>
                          <td class="py-2 px-3 text-right text-emerald-400 font-bold">{fmtPR(c.pagerank_score)}</td>
                          <td class="py-2 px-3 text-right text-indigo-300 font-bold">{shareFiltro.toFixed(3)}%</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                {#if displayedClubes.length < filteredClubes.length}
                  <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 text-center">
                    <button
                      on:click={loadMoreClubes}
                      class="px-5 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold hover:bg-indigo-500/20 transition flex items-center gap-2 mx-auto"
                    >
                      <ChevronDown class="w-4 h-4" />
                      Carregar mais ({filteredClubes.length - displayedClubes.length} restantes)
                    </button>
                  </div>
                {:else}
                  <div class="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                    Exibindo todos os {displayedClubes.length} clubes do recorte ativo.
                  </div>
                {/if}
              </div>
            </div>

            <!-- TABELA 2: COTAS POR ESTADO (PAGERANK RESIDUAL) -->
            <div class="space-y-3 pt-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <Globe class="w-4 h-4 text-emerald-400" />
                    Tabela de Estados — Distribuição de Cotas da Série D
                  </h3>
                  <p class="text-xs text-slate-400 mt-1">
                    As vagas da Série D são distribuídas descontando os clubes que o estado já possui nas Séries A, B e C. O saldo restante (PageRank Residual) define as vagas de cada federação.
                  </p>
                </div>
                <span class="text-xs text-slate-400 font-mono shrink-0">144 Vagas Auditadas</span>
              </div>

              <div class="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
                <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="sticky top-0 bg-slate-950 border-b border-slate-800 z-10">
                      <tr class="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th class="py-3 px-3 cursor-pointer hover:text-white sticky left-0 z-20 bg-slate-950 w-12" on:click={() => handleEstadoSort('uf')}>
                          UF <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white sticky left-12 z-20 bg-slate-950 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800 min-w-[130px]" on:click={() => handleEstadoSort('nome')}>
                          Estado <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleEstadoSort('macro_regiao')}>
                          Macro <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-right cursor-pointer hover:text-white" on:click={() => handleEstadoSort('populacao_ibge')}>
                          População IBGE <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white" on:click={() => handleEstadoSort('clubes_abc')}>
                          Clubes em A/B/C <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white" on:click={() => handleEstadoSort('vagas_esperadas_pr_residual')}>
                          Vagas PR Residual <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white font-bold text-white bg-slate-950" on:click={() => handleEstadoSort('vagas_canonicas_serie_d')}>
                          Cota Final Série D <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white" on:click={() => handleEstadoSort('delta_residual')}>
                          Balanço (&Delta;) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-right cursor-pointer hover:text-white" on:click={() => handleEstadoSort('clubes_por_milhao')}>
                          Clubes / Milhão <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-slate-300">
                      {#each sortedEstados as e}
                        {@const deltaResidual = e.vagas_canonicas_serie_d - e.vagas_esperadas_pr_residual}
                        {@const isMaiorQueMerecido = deltaResidual >= 0}
                        {@const clubesABC = (e.clubes_serie_a || 0) + (e.clubes_serie_b || 0) + (e.clubes_serie_c || 0)}
                        <tr class="hover:bg-slate-800/40 transition font-mono">
                          <td class="py-2.5 px-3 font-bold text-white sticky left-0 z-10 bg-slate-900/95">{e.uf}</td>
                          <td class="py-2.5 px-3 font-sans font-medium text-white sticky left-12 z-10 bg-slate-900/95 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] border-r border-slate-800 min-w-[130px] truncate">{e.nome}</td>
                          <td class="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{e.macro_regiao}</td>
                          <td class="py-2.5 px-3 text-right text-slate-400">{e.populacao_ibge.toLocaleString('pt-BR')}</td>

                          <!-- Clubes em A/B/C (tudo branco, limpo e direto) -->
                          <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            {#if clubesABC > 0}
                              <span class="font-bold text-white text-xs">{clubesABC}</span>
                              <div class="text-[10px] text-slate-300 flex items-center justify-center gap-1.5 mt-0.5 font-mono">
                                {#if e.clubes_serie_a > 0}<span>A:{e.clubes_serie_a}</span>{/if}
                                {#if e.clubes_serie_b > 0}<span>B:{e.clubes_serie_b}</span>{/if}
                                {#if e.clubes_serie_c > 0}<span>C:{e.clubes_serie_c}</span>{/if}
                              </div>
                            {:else}
                              <span class="text-slate-500 text-xs font-mono">0</span>
                            {/if}
                          </td>

                          <!-- Vagas PR Residual (branco limpo) -->
                          <td class="py-2.5 px-3 text-center font-semibold text-white whitespace-nowrap">{fmtNum(e.vagas_esperadas_pr_residual)}</td>

                          <!-- Cota Final Série D (Inteira) -->
                          <td class="py-2.5 px-3 text-center font-black text-white bg-slate-950/60 text-sm whitespace-nowrap">{e.vagas_canonicas_serie_d}</td>

                          <!-- Balanço Delta (sóbrio e limpo) -->
                          <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border {isMaiorQueMerecido ? 'bg-slate-800/80 text-white border-slate-700' : 'bg-slate-900 text-slate-400 border-slate-800'}">
                              {#if isMaiorQueMerecido}
                                +{fmtNum(deltaResidual)}
                              {:else}
                                {fmtNum(deltaResidual)}
                              {/if}
                            </span>
                          </td>

                          <!-- Clubes / Milhão -->
                          <td class="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">{fmtNum(e.clubes_por_milhao)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <div class="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4">
                  <span>Todas as 27 Unidades da Federação possuem representação garantida na Pirâmide Nacional.</span>
                  <span class="text-white font-semibold font-mono">Total de Vagas: 144</span>
                </div>
              </div>
            </div>

            <!-- Reprodutibilidade Aberta -->
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <span class="font-bold text-white text-sm flex items-center gap-2">
                <GitBranch class="w-4 h-4 text-indigo-400" /> Reprodutibilidade Aberta e Dados Transparentes
              </span>
              <p class="text-slate-300 leading-relaxed">
                Em alinhamento com as práticas de Ciência Aberta, os pipelines de dados, arquivos de parâmetros JSON e modelos de escalonamento CP-SAT estão documentados e versionados no repositório oficial do projeto:
              </p>
              <div class="flex flex-wrap gap-3 pt-1">
                <a
                  href="https://github.com/jgabrielsg/Simulacao-Futebol-Brasileiro"
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition font-mono"
                >
                  <Github class="w-3.5 h-3.5 text-indigo-400" /> jgabrielsg/Simulacao-Futebol-Brasileiro
                </a>
              </div>
            </div>
          {/if}
        </section>

      </article>

    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
    <p class="font-semibold text-slate-400">GeoFootballGraph-BR — Trabalho de Conclusão de Curso (2026)</p>
    <p class="text-[11px] text-slate-600 mt-1">Ciência de Dados, Pesquisa Operacional e Otimização Combinatória aplicada ao Futebol Brasileiro</p>
  </footer>

  <!-- MODAL LIGHTBOX DE ZOOM DE IMAGEM -->
  {#if zoomedImage}
    <div
      class="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md"
      transition:fade={{ duration: 180 }}
    >
      <!-- Top Control Bar -->
      <header class="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/90 select-none z-10 shrink-0">
        <div class="flex items-center gap-2 max-w-[50%] sm:max-w-[65%] truncate">
          <span class="text-xs sm:text-sm font-semibold text-white truncate">
            {zoomedImage.caption || zoomedImage.alt}
          </span>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <span class="hidden md:inline text-[11px] text-slate-400 font-mono">
            {#if zoomScale > 1}
              Arraste com o mouse • Clique para ajustar
            {:else}
              Clique para aproximar • Ctrl + Scroll
            {/if}
          </span>

          <!-- Zoom Controls -->
          <div class="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-xs font-mono text-slate-300">
            <button
              type="button"
              on:click={handleZoomOut}
              disabled={zoomScale <= 1}
              class="p-1.5 hover:text-white hover:bg-slate-800 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Afastar (-)"
            >
              <ZoomOut class="w-4 h-4" />
            </button>
            <button
              type="button"
              on:click={handleResetZoom}
              class="px-2.5 py-1 hover:text-white hover:bg-slate-800 rounded transition text-[11px] font-bold"
              title="Restaurar tamanho (100% / Ajustar à tela)"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              type="button"
              on:click={handleZoomIn}
              disabled={zoomScale >= 3.0}
              class="p-1.5 hover:text-white hover:bg-slate-800 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Aproximar (+)"
            >
              <ZoomIn class="w-4 h-4" />
            </button>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            on:click={closeZoom}
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Fechar (Esc)"
          >
            <X class="w-4 h-4" />
            <span class="hidden sm:inline">Fechar</span>
          </button>
        </div>
      </header>

      <!-- Scrollable / Draggable Image Canvas -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={scrollContainer}
        bind:clientWidth={containerWidth}
        bind:clientHeight={containerHeight}
        class="flex-1 overflow-auto w-full h-full flex select-none zoom-backdrop-target"
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
        on:click={handleBackdropClick}
        on:wheel={handleWheel}
        style="overscroll-behavior: contain;"
      >
        <div class="m-auto p-4 sm:p-10 flex items-center justify-center shrink-0 zoom-backdrop-target">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <img
            bind:this={imgElement}
            src={zoomedImage.src}
            alt={zoomedImage.alt}
            on:click={handleImageClick}
            on:load={handleImageLoad}
            draggable="false"
            style="width: {currentImgWidth}px; max-width: none; height: auto; transition: width 0.18s cubic-bezier(0.2, 0, 0, 1);"
            class="rounded-lg shadow-2xl border border-slate-800 {zoomScale === 1 ? 'cursor-zoom-in' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')} select-none block"
          />
        </div>
      </div>

      <footer class="py-2 px-4 bg-slate-900/50 border-t border-slate-800/60 text-center text-[11px] text-slate-400 shrink-0 select-none">
        Clique na imagem para alternar zoom • Arraste com o mouse para mover • Pressione <kbd class="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono text-[10px]">Esc</kbd> para fechar
      </footer>
    </div>
  {/if}
</div>