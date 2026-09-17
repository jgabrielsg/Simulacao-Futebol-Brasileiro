<script>
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import Navbar from '$lib/components/Navbar.svelte';
  import ClubImpactSearch from '$lib/components/ClubImpactSearch.svelte';
  import {
    Compass, Shield, MapPin, Award, ArrowRight, Play, CheckCircle2,
    BarChart3, TrendingDown, DollarSign, BookOpen, Clock, AlertTriangle,
    LayoutDashboard, Layers, RefreshCw, Bus, Plane, Trophy,
    Users, Check, Globe, Activity, ArrowUpRight, ChevronRight,
    Calendar, Zap, Sparkles, ChevronDown, Sliders, Route, Scale,
    FileText, GitBranch, GraduationCap
  } from 'lucide-svelte';

  const basePath = base ? base.replace(/\/$/, '') : '';

  // Active pyramid level drawer (default: Serie C)
  let selectedTier = 'serie-c';

  const pyramidTiers = [
    {
      id: 'serie-a',
      name: 'SÉRIE A',
      scope: 'Nacional (Turno e Returno Simétrico)',
      clubs: 20,
      matches: 380,
      rounds: '38 rodadas',
      accentColor: 'border-amber-500/50 bg-amber-500/5 text-amber-400',
      badgeBg: 'bg-amber-400',
      tagline: 'A Elite Continental Unificada',
      desc: 'Competição de âmbito nacional absoluto com 20 clubes disputando 38 rodadas em turno e returno espelhado. Os 4 últimos colocados sofrem rebaixamento compulsório para a Série B.',
      details: [
        { label: 'Formato', value: 'Pontos Corridos (38 Rodadas)' },
        { label: 'Mando de Campo', value: '19 Jogos Casa / 19 Fora' },
        { label: 'Fluxo de Acesso', value: 'Top 4 Libertadores / G6 Internacional' },
        { label: 'Fluxo de Descenso', value: '4 Rebaixados p/ Série B' }
      ]
    },
    {
      id: 'serie-b',
      name: 'SÉRIE B',
      scope: 'Nacional (Turno e Returno Simétrico)',
      clubs: 20,
      matches: 380,
      rounds: '38 rodadas',
      accentColor: 'border-slate-500/50 bg-slate-500/5 text-slate-300',
      badgeBg: 'bg-slate-400',
      tagline: 'O Segundo Escalão Nacional',
      desc: 'Competição nacional com 20 equipes em 38 rodadas. Promove os 4 primeiros colocados à divisão de elite e rebaixa os 4 últimos colocados para as Conferências Regionais da Série C.',
      details: [
        { label: 'Formato', value: 'Pontos Corridos (38 Rodadas)' },
        { label: 'Mando de Campo', value: '19 Jogos Casa / 19 Fora' },
        { label: 'Fluxo de Acesso', value: '4 Promovidos p/ Série A' },
        { label: 'Fluxo de Descenso', value: '4 Rebaixados p/ Série C' }
      ]
    },
    {
      id: 'serie-c',
      name: 'SÉRIE C',
      scope: '4 Conferências Regionais Contíguas',
      clubs: 60,
      matches: 870,
      rounds: '26 a 30 rodadas',
      accentColor: 'border-slate-500/50 bg-slate-500/5 text-slate-300',
      badgeBg: 'bg-slate-400',
      tagline: 'A Divisão Regionalizada de Transição',
      desc: 'Particionada em 4 Conferências Regionais geográficas (Sudeste com 16, Nordeste com 16, Sul-MS com 14 e Norte-Centro com 14). Disputada em turno e returno intra-conferência com play-ins locais e Quartas de Acesso Nacionais.',
      details: [
        { label: 'Formato', value: '4 Conferências Regionais em Turno e Returno' },
        { label: 'Garantia de Jogos', value: '26 a 30 partidas mínimas por clube' },
        { label: 'Fluxo de Acesso', value: '4 Semifinalistas sobem p/ Série B' },
        { label: 'Fluxo de Descenso', value: '8 Clubes caem p/ Série D (2 por região)' }
      ]
    },
    {
      id: 'serie-d',
      name: 'SÉRIE D',
      scope: '18 Ligas Regionais em 4 Macrorregiões',
      clubs: 144,
      matches: 1102,
      rounds: '10 a 18 rodadas',
      accentColor: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400',
      badgeBg: 'bg-emerald-400',
      tagline: 'A Grande Base Continental do País',
      desc: 'Distribuída em 18 Ligas Regionais compactas (6 corredores blindados no Norte-Centro e 12 ligas geradas via CP-SAT Medoids). Sem rebaixamento nacional: 8 clubes sobem para a Série C e as vagas anuais são renovadas pelos Campeonatos Estaduais via cotas invariantes.',
      details: [
        { label: 'Formato', value: '18 Ligas (Turno e Returno Intra-Liga) + Play-ins' },
        { label: 'Playoffs de Acesso', value: 'Dois Anéis Concêntricos (Regional -> Inter-regional)' },
        { label: 'Fluxo de Acesso', value: '8 Finalistas sobem p/ Série C (2 por região)' },
        { label: 'Invariância Federativa', value: 'Vagas de Acesso geridas pelas 27 Federações' }
      ]
    }
  ];

  // Timeline comparison toggle ('atual' | 'proposto')
  let activeTimeline = 'atual';

  // --- GEOTACTICAL CANVAS BACKGROUND (SSR-SAFE) ---
  let canvasEl;
  let animId;

  // Major football hubs in Brazil (Lat / Lon)
  const HUBS = [
    { name: 'Manaus', lat: -3.119, lon: -60.021, hub: true },
    { name: 'Belém', lat: -1.455, lon: -48.490, hub: true },
    { name: 'Fortaleza', lat: -3.731, lon: -38.526, hub: true },
    { name: 'Natal', lat: -5.794, lon: -35.211 },
    { name: 'Recife', lat: -8.047, lon: -34.877, hub: true },
    { name: 'Maceió', lat: -9.665, lon: -35.735 },
    { name: 'Salvador', lat: -12.971, lon: -38.510, hub: true },
    { name: 'Aracaju', lat: -10.947, lon: -37.073 },
    { name: 'São Luís', lat: -2.530, lon: -44.302 },
    { name: 'Teresina', lat: -5.089, lon: -42.801 },
    { name: 'João Pessoa', lat: -7.115, lon: -34.863 },
    { name: 'Palmas', lat: -10.184, lon: -48.333 },
    { name: 'Cuiabá', lat: -15.601, lon: -56.097, hub: true },
    { name: 'Brasília', lat: -15.794, lon: -47.882, hub: true },
    { name: 'Goiânia', lat: -16.686, lon: -49.264, hub: true },
    { name: 'Campo Grande', lat: -20.469, lon: -54.620 },
    { name: 'Belo Horizonte', lat: -19.921, lon: -43.937, hub: true },
    { name: 'Vitória', lat: -20.315, lon: -40.312 },
    { name: 'Rio de Janeiro', lat: -22.906, lon: -43.172, hub: true },
    { name: 'São Paulo', lat: -23.550, lon: -46.633, hub: true },
    { name: 'Santos', lat: -23.960, lon: -46.333 },
    { name: 'Campinas', lat: -22.905, lon: -47.060 },
    { name: 'Curitiba', lat: -25.428, lon: -49.273, hub: true },
    { name: 'Florianópolis', lat: -27.595, lon: -48.548, hub: true },
    { name: 'Caxias do Sul', lat: -29.167, lon: -51.179 },
    { name: 'Porto Alegre', lat: -30.034, lon: -51.217, hub: true },
    { name: 'Pelotas', lat: -31.765, lon: -52.337 },
    { name: 'Chapecó', lat: -27.100, lon: -52.615 },
    { name: 'Londrina', lat: -23.304, lon: -51.169 },
    { name: 'Porto Velho', lat: -8.761, lon: -63.903 },
    { name: 'Rio Branco', lat: -9.974, lon: -67.824 },
    { name: 'Macapá', lat: 0.034, lon: -51.069 },
    { name: 'Boa Vista', lat: 2.823, lon: -60.675 }
  ];

  const EDGES = [
    ['Porto Alegre', 'Curitiba'],
    ['Curitiba', 'São Paulo'],
    ['São Paulo', 'Rio de Janeiro'],
    ['Rio de Janeiro', 'Belo Horizonte'],
    ['São Paulo', 'Belo Horizonte'],
    ['Belo Horizonte', 'Brasília'],
    ['São Paulo', 'Goiânia'],
    ['Goiânia', 'Brasília'],
    ['Brasília', 'Cuiabá'],
    ['Cuiabá', 'Campo Grande'],
    ['Campo Grande', 'São Paulo'],
    ['Belo Horizonte', 'Vitória'],
    ['Vitória', 'Salvador'],
    ['Belo Horizonte', 'Salvador'],
    ['Brasília', 'Salvador'],
    ['Salvador', 'Aracaju'],
    ['Aracaju', 'Maceió'],
    ['Maceió', 'Recife'],
    ['Recife', 'João Pessoa'],
    ['João Pessoa', 'Natal'],
    ['Natal', 'Fortaleza'],
    ['Fortaleza', 'Teresina'],
    ['Teresina', 'São Luís'],
    ['São Luís', 'Belém'],
    ['Brasília', 'Palmas'],
    ['Palmas', 'Belém'],
    ['Belém', 'Macapá'],
    ['Belém', 'Manaus'],
    ['Manaus', 'Boa Vista'],
    ['Manaus', 'Porto Velho'],
    ['Porto Velho', 'Rio Branco'],
    ['Cuiabá', 'Porto Velho'],
    ['Porto Alegre', 'Pelotas'],
    ['Curitiba', 'Florianópolis'],
    ['Florianópolis', 'Porto Alegre'],
    ['Curitiba', 'Londrina'],
    ['Londrina', 'São Paulo'],
    ['Florianópolis', 'Chapecó'],
    ['Chapecó', 'Porto Alegre'],
    ['São Paulo', 'Campinas'],
    ['Campinas', 'Belo Horizonte'],
    ['São Paulo', 'Santos'],
    ['Brasília', 'Fortaleza'],
    ['Brasília', 'Recife'],
    ['São Paulo', 'Salvador'],
    ['São Paulo', 'Recife'],
    ['São Paulo', 'Manaus'],
    ['Rio de Janeiro', 'Fortaleza']
  ];

  function project(lat, lon, w, h) {
    const minLat = -34.5;
    const maxLat = 5.5;
    const minLon = -74.0;
    const maxLon = -34.0;

    // Centered bounding box with padding
    const padX = w * 0.08;
    const padY = h * 0.08;
    const drawW = w - padX * 2;
    const drawH = h - padY * 2;

    const x = padX + ((lon - minLon) / (maxLon - minLon)) * drawW;
    const y = padY + ((maxLat - lat) / (maxLat - minLat)) * drawH;
    return { x, y };
  }

  onMount(() => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    // Build particle pool along random edges
    const particles = Array.from({ length: 400 }, (_, idx) => {
      const edge = EDGES[idx % EDGES.length];
      return {
        edge,
        t: Math.random(),
        speed: 0.0012 + Math.random() * 0.0018,
        color: idx % 3 === 0 ? 'rgba(52, 211, 153, 0.75)' : 'rgba(148, 163, 184, 0.75)'
      };
    });

    function resize() {
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    // Render loop
    function render() {
      ctx.clearRect(0, 0, width, height);

      // Map lookup
      const hubMap = new Map();
      HUBS.forEach(h => {
        hubMap.set(h.name, project(h.lat, h.lon, width, height));
      });

      // 1. Draw subtle road/air grid lines
      ctx.lineWidth = 1;
      EDGES.forEach(([fromName, toName]) => {
        const p1 = hubMap.get(fromName);
        const p2 = hubMap.get(toName);
        if (!p1 || !p2) return;

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // 2. Draw animated transport pulses along edges
      particles.forEach(pt => {
        pt.t += pt.speed;
        if (pt.t > 1) {
          pt.t = 0;
          pt.edge = EDGES[Math.floor(Math.random() * EDGES.length)];
        }
        const p1 = hubMap.get(pt.edge[0]);
        const p2 = hubMap.get(pt.edge[1]);
        if (!p1 || !p2) return;

        const curX = p1.x + (p2.x - p1.x) * pt.t;
        const curY = p1.y + (p2.y - p1.y) * pt.t;

        // Pulse dot
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw nodes (hubs and cities)
      HUBS.forEach(h => {
        const p = hubMap.get(h.name);
        if (!p) return;

        if (h.hub) {
          // Outer halo for main hubs
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  });

  onDestroy(() => {
    if (animId) cancelAnimationFrame(animId);
  });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
  <Navbar />

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- ATO 1: O GANCHO TERRITORIAL & HERO DE TELEMETRIA           -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="relative w-full overflow-hidden border-b border-slate-800/80">
    
    <!-- Authentic Canvas Background (GIS Network & Transit Arcs) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
      <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
      <!-- Technical Radial Mask: Keeps foreground text crisp and readable -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950"></div>
    </div>

    <!-- Hero Content Container -->
    <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 space-y-10">
      
      <!-- Academic & Operational Header Badge -->
      <div class="flex flex-wrap items-center justify-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono font-semibold tracking-wide shadow-sm">
          <Compass class="w-3.5 h-3.5 text-slate-400" />
          PESQUISA OPERACIONAL & CIÊNCIA DE REDES
        </span>
        <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 text-xs font-mono">
          <GraduationCap class="w-3.5 h-3.5 text-slate-400" />
          FGV EMAp (2026)
        </span>
      </div>

      <!-- Main Provocative Editorial Title -->
      <div class="text-center space-y-4 max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
          8,5 Milhões de km², 214M de Pessoas.<br />
          <span>
            E um País de Apenas 40 Clubes?
          </span>
        </h1>

        <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
          Uma formulação estrita de <strong>Otimização Combinatória e Teoria dos Grafos</strong> para reestruturar as divisões de acesso do futebol brasileiro: erradicação do vácuo sazonal de 8 meses, <strong>204 clubes em atividade contínua nas Séries C e D</strong> e redução de <strong>56,3% nos custos de deslocamento por partida</strong> sob o subsídio logístico da CBF.
        </p>
      </div>

      <!-- Action Gateways Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
        <a
          href="/estudo-de-caso"
          class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <BarChart3 class="w-4 h-4 text-white" />
          Explorar Estudo de Caso & Rotas
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        <a
          href="#piramide"
          class="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers class="w-4 h-4 text-slate-400" />
          A Pirâmide Interativa
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </a>

        <a
          href="/dashboard"
          class="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play class="w-3.5 h-3.5 text-emerald-400 fill-current" />
          Simulador Quinquenal
        </a>
      </div>

      <!-- Unified Telemetry Ribbon (High-Signal, Zero AI Slop) -->
      <div class="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 text-center font-mono">
        <div class="pt-2 sm:pt-0">
          <span class="text-2xl sm:text-3xl font-black text-white block">244</span>
          <span class="text-[11px] font-sans text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Clubes na Pirâmide</span>
          <span class="text-[10px] font-sans text-slate-400">A: 20 | B: 20 | C: 60 | D: 144</span>
        </div>

        <div class="pt-3 sm:pt-0 sm:pl-4">
          <span class="text-2xl sm:text-3xl font-black text-emerald-400 block">1.959</span>
          <span class="text-[11px] font-sans text-emerald-300 font-semibold uppercase tracking-wider block mt-0.5">Jogos no Ano</span>
          <span class="text-[10px] font-sans text-slate-400">+160% vs. 758 atuais</span>
        </div>

        <div class="pt-3 sm:pt-0 sm:pl-4">
          <span class="text-2xl sm:text-3xl font-black text-emerald-400 block">-56,3%</span>
          <span class="text-[11px] font-sans text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Custo Médio / Partida</span>
          <span class="text-[10px] font-sans text-slate-400">R$ 105k &rarr; R$ 45,8k</span>
        </div>

        <div class="pt-3 sm:pt-0 sm:pl-4">
          <span class="text-2xl sm:text-3xl font-black text-amber-400 block">Abr a Nov</span>
          <span class="text-[11px] font-sans text-amber-300 font-semibold uppercase tracking-wider block mt-0.5">Calendário Contínuo</span>
          <span class="text-[10px] font-sans text-slate-400">Fim do vácuo de 8 meses</span>
        </div>
      </div>

    </div>
  </section>

  <!-- MAIN EDITORIAL BODY -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-24">

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ATO 2: O ABISMO DA DESCONTINUIDADE (THE CONFLICT)          -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="space-y-8">
      <div class="max-w-3xl space-y-2">
        <span class="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5" />
          A Anomalia Estrutural do Futebol Brasileiro
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          O Vazio de Calendário: Por que 60% dos Clubes Desaparecem no Segundo Semestre?
        </h2>
        <p class="text-sm text-slate-400 leading-relaxed">
          Enquanto as Séries A e B concentram 100% da atenção da mídia e garantem 38 rodadas anuais, as divisões organizadas pela CBF para a base do futebol nacional impõem uma interrupção precoce e danosa das atividades profissionais.
        </p>
      </div>

      <!-- Comparative Timeline Matrix -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        
        <!-- Toggle Switch -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Diagnóstico de Sazonalidade</span>
            <span class="text-sm font-bold text-white">Compare a distribuição temporal de partidas ao longo do ano civil:</span>
          </div>

          <div class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto font-mono text-xs">
            <button
              on:click={() => activeTimeline = 'atual'}
              class={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                activeTimeline === 'atual'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Status Quo CBF (2026)
            </button>
            <button
              on:click={() => activeTimeline = 'proposto'}
              class={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                activeTimeline === 'proposto'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nova Pirâmide Proposta
            </button>
          </div>
        </div>

        {#if activeTimeline === 'atual'}
          <!-- TIMELINE: STATUS QUO CBF -->
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <span class="text-[10px] font-mono text-slate-500 uppercase block">Janeiro a Abril</span>
                <span class="font-bold text-white text-sm block">Campeonatos Estaduais</span>
                <p class="text-slate-400 leading-relaxed">
                  Mais de 180 agremiações competem em seus respectivos estados. Ilusão de atividade plena com atletas contratados por apenas 3 a 4 meses.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                <span class="text-[10px] font-mono text-rose-400 uppercase block">Maio a Julho</span>
                <span class="font-bold text-rose-300 text-sm block">O Corte da Série D</span>
                <p class="text-slate-300 leading-relaxed">
                  Na 1ª fase (16 grupos de 6 equipes), são apenas <strong>10 partidas mínimas</strong>. 32 clubes são eliminados em julho e encerram o ano desportivo.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1.5">
                <span class="text-[10px] font-mono text-rose-400 uppercase block">Agosto em Diante</span>
                <span class="font-bold text-rose-200 text-sm block">O Deserto Operacional da Série C</span>
                <p class="text-slate-300 leading-relaxed">
                  Fim da 1ª fase (19 rodadas): <strong>12 dos 20 clubes (60%) são eliminados</strong>. Demissões em massa e 8 meses de ociosidade absoluta até o ano seguinte.
                </p>
              </div>
            </div>

            <!-- Visual Bar Representation -->
            <div class="space-y-1.5 pt-2">
              <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>JAN</span><span>FEV</span><span>MAR</span><span>ABR</span>
                <span>MAI</span><span>JUN</span><span>JUL</span><span class="text-rose-400 font-bold">AGO</span>
                <span class="text-rose-400 font-bold">SET</span><span class="text-rose-400 font-bold">OUT</span><span class="text-rose-400 font-bold">NOV</span><span class="text-rose-400 font-bold">DEZ</span>
              </div>
              <div class="h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                <div class="w-1/3 bg-slate-700" title="Estaduais"></div>
                <div class="w-1/4 bg-amber-500/70" title="Séries C e D Fases Iniciais"></div>
                <div class="flex-1 bg-rose-950/80 border-l border-rose-500/30 flex items-center justify-center">
                  <span class="text-[9px] font-mono text-rose-400 uppercase font-bold tracking-wider">Vazio de Calendário</span>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- TIMELINE: PROPOSTA OTIMIZADA -->
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <span class="text-[10px] font-mono text-slate-400 uppercase block">Janeiro a Março/Abril</span>
                <span class="font-bold text-white text-sm block">Estaduais como Seletivas Meritocráticas</span>
                <p class="text-slate-300 leading-relaxed">
                  As federações mantém seus campeonatos locais intactos, que classificam os clubes para as vagas invariantes da Série D por mérito técnico (PageRank Residual).
                </p>
              </div>

              <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <span class="text-[10px] font-mono text-emerald-400 uppercase block">Abril a Setembro</span>
                <span class="font-bold text-emerald-300 text-sm block">Ligas e Conferências Regulares</span>
                <p class="text-slate-300 leading-relaxed">
                  <strong>204 clubes em atividade simultânea</strong> nas Séries C e D. Turno e returno completo (26 a 30 rodadas na Série C; 10 a 18 jogos intra-liga na Série D).
                </p>
              </div>

              <div class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                <span class="text-[10px] font-mono text-emerald-400 uppercase block">Outubro a Novembro</span>
                <span class="font-bold text-emerald-200 text-sm block">Play-ins e Quartas de Acesso</span>
                <p class="text-slate-300 leading-relaxed">
                  Playoffs regionais e mata-matas nacionais em dois anéis concêntricos decidem os 4 acessos para a Série B e os 8 acessos para a Série C com público em alta.
                </p>
              </div>
            </div>

            <!-- Visual Bar Representation -->
            <div class="space-y-1.5 pt-2">
              <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>JAN</span><span>FEV</span><span>MAR</span><span>ABR</span>
                <span>MAI</span><span>JUN</span><span>JUL</span><span class="text-emerald-400 font-bold">AGO</span>
                <span class="text-emerald-400 font-bold">SET</span><span class="text-emerald-400 font-bold">OUT</span><span class="text-emerald-400 font-bold">NOV</span><span>DEZ</span>
              </div>
              <div class="h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                <div class="w-1/4 bg-slate-700" title="Estaduais"></div>
                <div class="w-2/3 bg-emerald-500/80" title="Séries C e D em Atividade Regular"></div>
                <div class="flex-1 bg-slate-800/60" title="Férias e Pré-Temporada"></div>
              </div>
            </div>
          </div>
        {/if}

      </div>
    </section>

    <!-- BUSCA & IMPACTO POR CLUBE (Hook do Martini Glass: Club Ego Search) -->
    <ClubImpactSearch />
    
    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ATO 3: A NOVA PIRÂMIDE DOS 244 CLUBES (#piramide)         -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section id="piramide" class="space-y-8 scroll-mt-20">
      <div class="max-w-3xl space-y-2">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
          <Trophy class="w-3.5 h-3.5" />
          A Estrutura Integral do Futebol Nacional
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          A Pirâmide Escalonada dos 244 Clubes
        </h2>
        <p class="text-sm text-slate-400 leading-relaxed">
          Uma arquitetura harmônica que integra os dois níveis de elite nacional às duas divisões regionalizadas de acesso, ancorada no princípio do elevador fechado e na conservação federativa.
        </p>
      </div>

      <!-- Stepped Visual Pyramid Selector -->
      <div class="space-y-3">
        {#each pyramidTiers as tier}
          <!-- Pyramid Step Row -->
          <div
            on:click={() => selectedTier = tier.id}
            on:keydown={(e) => { if (e.key === 'Enter') selectedTier = tier.id; }}
            role="button"
            tabindex="0"
            class={`cursor-pointer transition-all rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              selectedTier === tier.id
                ? `${tier.accentColor} shadow-lg ring-1 ring-white/10`
                : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div class="flex items-center gap-4">
              <span class={`w-3 h-3 rounded-full shrink-0 ${tier.badgeBg}`}></span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-black text-white">{tier.name}</h3>
                  <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                    {tier.clubs} Clubes
                  </span>
                </div>
                <span class="text-xs text-slate-400 font-medium block mt-0.5">{tier.scope}</span>
              </div>
            </div>

            <div class="flex items-center justify-between md:justify-end gap-6 font-mono text-xs">
              <div class="text-left md:text-right">
                <span class="text-slate-500 text-[10px] block uppercase">Partidas no Ano</span>
                <span class="font-bold text-white text-sm">{tier.matches}</span>
              </div>
              <div class="text-left md:text-right">
                <span class="text-slate-500 text-[10px] block uppercase">Rodadas / Clube</span>
                <span class="font-bold text-emerald-400 text-sm">{tier.rounds}</span>
              </div>
              <ChevronRight class={`w-5 h-5 transition-transform ${selectedTier === tier.id ? 'rotate-90 text-white' : 'text-slate-600'}`} />
            </div>
          </div>

          <!-- Drawer of Selected Tier Details -->
          {#if selectedTier === tier.id}
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <span class="font-bold text-white text-sm flex items-center gap-2">
                  <Shield class="w-4 h-4 text-slate-400" />
                  {tier.tagline}
                </span>
                <span class="font-mono text-slate-400">{tier.name} — Especificação Canônica</span>
              </div>

              <p class="text-slate-300 leading-relaxed text-sm">
                {tier.desc}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono">
                {#each tier.details as d}
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5">
                    <span class="text-slate-500 text-[10px] block uppercase font-sans font-semibold">{d.label}</span>
                    <span class="text-slate-200 font-bold text-xs">{d.value}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Fluxo da Pirâmide Callout -->
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div class="space-y-0.5">
          <span class="font-bold text-white flex items-center gap-1.5">
            <Scale class="w-4 h-4 text-emerald-400" /> O Princípio do Elevador Fechado
          </span>
          <p class="text-slate-400">
            Exatamente 2 clubes sobem da Série D e 2 clubes descem da Série C em cada uma das 4 macrorregiões (&Delta;K<sub>r</sub> = 0), mantendo a estabilidade geográfica perpétua.
          </p>
        </div>
        <a
          href="/metodologia"
          class="shrink-0 px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 font-mono text-[11px]"
        >
          Ver prova matemática <ArrowRight class="w-3 h-3" />
        </a>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ATO 4: OS TRÊS SALTOS DE EFICIÊNCIA (THE EVIDENCE)         -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="space-y-8">
      <div class="max-w-3xl space-y-2">
        <span class="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
          <BarChart3 class="w-3.5 h-3.5" />
          Auditoria de Impacto
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Como a Otimização Multiplica Jogos Cortando Desperdício
        </h2>
        <p class="text-sm text-slate-400 leading-relaxed">
          O confronto direto entre as duas diretrizes: a ineficiência radial do modelo oficial vigente da CBF contra a engenharia de redes e turnês encadeadas TTP-k, sendo sempre o principal objetivo priorizar o maior número possível de embates entre clubes, focando em viagens curtas e de baixo custo.
        </p>
      </div>

      <!-- 3 Structural Breakthrough Panels -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Salto 1: Volume & Empregabilidade -->
        <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
          <div class="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">1. Empregabilidade Desportiva</span>
            <h3 class="text-lg font-bold text-white mt-0.5">+160% em Jogos Oficiais</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            De 758 para <strong>1.959 partidas oficiais</strong> no somatório das Séries C e D. São 1.201 jogos a mais no ano para gerar receitas locais de bilheteria e assegurar contratos de trabalho formais e contínuos para mais de 6.000 profissionais do ecossistema.
          </p>
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Clubes Ativos (C+D):</span>
            <span class="text-emerald-400 font-bold">116 &rarr; 204 clubes</span>
          </div>
        </div>

        <!-- Salto 2: Racionalidade de Modais -->
        <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Bus class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">2. Fisiologia & Transporte</span>
            <h3 class="text-lg font-bold text-white mt-0.5">80,9% no Modal Rodoviário</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            No modelo atual, a CBF subsidia voos comerciais caríssimos de última hora. Na proposta, <strong>1.595 partidas utilizam ônibus leito fretado</strong> com teto de 15h de estrada e turnês encadeadas TTP-k, preservando a fisiologia dos atletas e reduzindo emissões de carbono.
          </p>
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Quilometragem Média:</span>
            <span class="text-emerald-300 font-bold">-63,8% por confronto</span>
          </div>
        </div>

        <!-- Salto 3: Paradoxo Orçamentário Resolvido -->
        <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-4">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">3. Equilíbrio Orçamentário CBF</span>
            <h3 class="text-lg font-bold text-white mt-0.5">-59,2% no Custo Unitário</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            O custo logístico médio despenca de <strong>R$ 105.036,00 para R$ 42.862,00 por partida</strong>. Com isso, a CBF necessita de um acréscimo líquido de apenas <strong>+5,46% no orçamento global</strong> (R$ 79,6M para R$ 83,97M) para viabilizar mais que o dobro de jogos no país (+158,4%).
          </p>
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span class="text-slate-500">Economia em Turnês:</span>
            <span class="text-emerald-400 font-bold">R$ 31,14M anuais</span>
          </div>
        </div>

      </div>

      <!-- COMPARATIVO ORÇAMENTÁRIO CBF: "COMO A CONTA FECHA" -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span class="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block">
              Auditoria de Viabilidade Financeira
            </span>
            <h3 class="text-lg sm:text-xl font-black text-white mt-0.5">
              O Paradoxo Resolvido: +158% de Futebol com Apenas +5,5% de Custo
            </h3>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
            <DollarSign class="w-3.5 h-3.5 text-emerald-400" />
            Parâmetros Oficiais CBF 2026
          </span>
        </div>

        <!-- Comparative Side-by-Side Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 text-[11px]">
                <th class="py-3 px-3 font-sans font-semibold">Dimensão Analisada</th>
                <th class="py-3 px-3 text-slate-400 font-bold">Status Quo CBF (2026)</th>
                <th class="py-3 px-3 text-emerald-400 font-bold">Nova Pirâmide Proposta</th>
                <th class="py-3 px-3 text-right text-slate-400 font-bold">Variação Real</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-200">
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 font-sans font-medium text-white flex items-center gap-2">
                  <Play class="w-3 h-3 text-slate-400 shrink-0" />
                  Volume Total de Jogos (C + D)
                </td>
                <td class="py-3 px-3 text-slate-400">758 partidas</td>
                <td class="py-3 px-3 font-bold text-white">1.959 partidas</td>
                <td class="py-3 px-3 text-right font-bold text-emerald-400">+158,4% (+1.201 jogos)</td>
              </tr>
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 font-sans font-medium text-white flex items-center gap-2">
                  <Shield class="w-3 h-3 text-slate-400 shrink-0" />
                  Clubes com Calendário Nacional Completo
                </td>
                <td class="py-3 px-3 text-slate-400">40 clubes (A e B)</td>
                <td class="py-3 px-3 font-bold text-white">244 clubes (A, B, C e D)</td>
                <td class="py-3 px-3 text-right font-bold text-emerald-400">+510% (+204 clubes)</td>
              </tr>
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 font-sans font-medium text-white flex items-center gap-2">
                  <DollarSign class="w-3 h-3 text-slate-400 shrink-0" />
                  Custo Logístico Médio por Partida
                </td>
                <td class="py-3 px-3 text-slate-400 font-medium">R$ 105.036,00</td>
                <td class="py-3 px-3 text-emerald-400 font-bold">R$ 42.862,00</td>
                <td class="py-3 px-3 text-right font-bold text-emerald-400">-59,19% de economia unitária</td>
              </tr>
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 font-sans font-medium text-white flex items-center gap-2">
                  <Bus class="w-3 h-3 text-slate-400 shrink-0" />
                  Predominância de Ônibus Leito vs. Aéreo
                </td>
                <td class="py-3 px-3 text-slate-400">18,6% rodoviário (81,4% aéreo)</td>
                <td class="py-3 px-3 font-bold text-white">80,9% rodoviário (1.595 jogos)</td>
                <td class="py-3 px-3 text-right font-bold text-emerald-400">4,3x mais transporte rodoviário</td>
              </tr>
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-3 font-sans font-medium text-white flex items-center gap-2">
                  <Route class="w-3 h-3 text-slate-400 shrink-0" />
                  Economia Logística com Turnês TTP-k
                </td>
                <td class="py-3 px-3 text-slate-400">R$ 0,00 (modelo radial bate-volta)</td>
                <td class="py-3 px-3 font-bold text-white">R$ 31,14 milhões / ano</td>
                <td class="py-3 px-3 text-right font-bold text-emerald-400">Viagens encadeadas otimizadas</td>
              </tr>
              <tr class="bg-slate-950/60 border-t border-slate-700 font-bold text-white">
                <td class="py-3 px-3 font-sans flex items-center gap-2">
                  <Scale class="w-3 h-3 text-slate-400 shrink-0" />
                  Orçamento Global de Deslocamento CBF
                </td>
                <td class="py-3 px-3 text-slate-400">R$ 79,62 milhões</td>
                <td class="py-3 px-3 text-white">R$ 83,97 milhões</td>
                <td class="py-3 px-3 text-right text-emerald-400 font-bold">+5,46% (+R$ 4,35M)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Explanatory Insight Callout -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span class="font-bold text-rose-400 flex items-center gap-1.5 font-sans">
              <AlertTriangle class="w-3.5 h-3.5" /> O Gargalo Atual (R$ 105k / jogo)
            </span>
            <p class="text-slate-400 leading-relaxed">
              No modelo vigente, 81,4% das viagens da Série C e D dependem de passagens aéreas comerciais adquiridas em janelas curtas, com conexões em grandes hubs (Brasília, Campinas, Guarulhos) e frete aéreo para 32 pessoas, encarecendo desproporcionalmente confrontos regionais.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span class="font-bold text-emerald-400 flex items-center gap-1.5 font-sans">
              <CheckCircle2 class="w-3.5 h-3.5" /> A Solução Matemática (R$ 42,9k / jogo)
            </span>
            <p class="text-slate-400 leading-relaxed">
              A clusterização geográfica por medóides aproxima os adversários para o raio de ônibus leito (R$ 40/km). Nas viagens longas, o algoritmo TTP-k agrupa de 2 a 4 jogos fora seguidos, evitando idas e voltas semanais e poupando R$ 31,14M por temporada.
            </p>
          </div>
        </div>
      </div>

      <!-- Direct Link to Detailed Case Study Table -->
      <div class="text-center pt-2">
        <a
          href="/estudo-de-caso"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm"
        >
          <BarChart3 class="w-4 h-4 text-slate-400" />
          Ver Tabela Mestre Completa & Análise Clube a Clube no Estudo de Caso
          <ArrowRight class="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- ATO 5: OS TRÊS PORTAIS DE ENTRADA (THE GATEWAYS)           -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="space-y-8 pt-4">
      <div class="text-center max-w-3xl mx-auto space-y-2">
        <span class="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Exploração da Pesquisa
        </span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          Escolha Seu Caminho de Investigação
        </h2>
        <p class="text-sm text-slate-400 leading-relaxed">
          Acesse os módulos especializados conforme o seu objetivo técnico ou esportivo:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Portal 1: Estudo de Caso -->
        <div class="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <BarChart3 class="w-6 h-6" />
            </div>
            <div>
              <span class="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Módulo de Auditoria</span>
              <h3 class="text-xl font-bold text-white group-hover:text-slate-200 transition-colors">Estudo de Caso & Rotas</h3>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">
              Auditoria de rotas para clubes reais de todas as regiões (Trem-AP, Barra-SC, Ji-Paraná-RO, América-RN), explorador interativo com slider dos 16 grupos da Série D oficial e comparador com a Série C.
            </p>
            <ul class="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Sliders oficiais dos Grupos A1 a A16</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Detalhamento de turnês TTP-2 a TTP-6</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Mapa interativo com traçado vetorial</li>
            </ul>
          </div>

          <a
            href="/estudo-de-caso"
            class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            Acessar Estudo de Caso <ArrowRight class="w-3.5 h-3.5" />
          </a>
        </div>

        <!-- Portal 2: Metodologia Científica -->
        <div class="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-6 group">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen class="w-6 h-6" />
            </div>
            <div>
              <span class="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Módulo Teórico</span>
              <h3 class="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Dossiê Metodológico</h3>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">
              As 8 seções científicas completas: fundamentação matemática em KaTeX, modelagem do PageRank Esportivo com 876 clubes, distritamento CP-SAT, prova de invariância federativa e formulação TTP-k.
            </p>
            <ul class="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Equações canônicas em KaTeX nativo</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Tabela pesquisável dos 876 clubes</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> 6 Corredores Amazônicos Blindados</li>
            </ul>
          </div>

          <a
            href="/metodologia"
            class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            Ler Dossiê Científico <ArrowRight class="w-3.5 h-3.5" />
          </a>
        </div>

        <!-- Portal 3: Simulador Quinquenal -->
        <div class="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <LayoutDashboard class="w-6 h-6" />
            </div>
            <div>
              <span class="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Módulo Interativo</span>
              <h3 class="text-xl font-bold text-white group-hover:text-slate-200 transition-colors">Simulador Quinquenal</h3>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">
              O motor de simulação dinâmica rodando 5 temporadas consecutivas. Acompanhe a tabela e custos rodada a rodada, play-ins, playoffs e a re-clusterização geográfica bianual de conferências.
            </p>
            <ul class="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Player interativo rodada a rodada</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Rastreamento logístico em tempo real</li>
              <li class="flex items-center gap-1.5"><Check class="w-3.5 h-3.5 text-emerald-400" /> Algoritmo Húngaro de designação ótima</li>
            </ul>
          </div>

          <a
            href="/dashboard"
            class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            Abrir Simulador Interativo <ArrowRight class="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>

  </main>

  <!-- FOOTER ACADÊMICO & INSTITUCIONAL -->
  <footer class="border-t border-slate-800/80 py-10 bg-slate-950 text-xs text-slate-500">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div class="space-y-1">
        <p class="font-bold text-slate-300">GeoFootGraph-BR — Trabalho de Conclusão de Curso (2026)</p>
        <p class="text-[11px] text-slate-600">Pesquisador: João Gabriel Machado (Arroio do Sal — RS) | B.Sc. em Ciência de Dados e Inteligência Artificial</p>
        <p class="text-[11px] text-slate-600">Escola de Matemática Aplicada (EMAp) — Fundação Getulio Vargas (FGV, Rio de Janeiro)</p>
      </div>

      <div class="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
        <a
          href="https://github.com/jgabrielsg/Simulacao-Futebol-Brasileiro"
          target="_blank"
          rel="noreferrer"
          class="hover:text-white transition flex items-center gap-1.5"
        >
          <GitBranch class="w-3.5 h-3.5 text-slate-400" /> Repositório GitHub
        </a>
        <span class="text-slate-800">•</span>
        <span>Licença MIT</span>
      </div>
    </div>
  </footer>
</div>
