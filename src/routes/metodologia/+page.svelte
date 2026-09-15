<script>
  import { onMount } from 'svelte';
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
    Check, ArrowRight, Table2
  } from 'lucide-svelte';

  const tocItems = [
    { id: 'hero', label: '1. Visão Geral & Credenciais' },
    { id: 'fontes', label: '2. Estratégia de Dados & Fontes' },
    { id: 'paradoxo', label: '3. O Paradoxo Territorial' },
    { id: 'piramide', label: '4. A Nova Pirâmide (244 Clubes)' },
    { id: 'pagerank', label: '5. Teoria dos Grafos & PageRank' },
    { id: 'vagas', label: '6. Vagas Multicritério da Série D' },
    { id: 'tournament', label: '7. Tournament Design & Co-Campeões' },
    { id: 'elevador', label: '8. O Princípio do Elevador Fechado' },
    { id: 'engenharia-logistica', label: '9. Engenharia Multimodal & Custos CBF' },
    { id: 'cpsat', label: '10. Otimização Combinatória: CP-SAT & TTP-k' },
    { id: 'balanco', label: '11. Balanço Fiscal & Repositórios' },
    { id: 'analytics', label: '12. Analytics Interativo de PageRank' }
  ];

  let activeSection = 'hero';

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
  const fFederativa = '\\text{Vagas via Estadual}(u) = \\text{Cota Estrutural}(u) - \\text{Rebaixados da Série C da UF}(u)';
  const fTransicao = '\\text{Custo}(i, j, \\ell) = \\min\\left(\\text{Custo Turnê}(j \\to \\ell),\\; \\frac{C_{i,j} + C_{i,\\ell}}{2}\\right)';
  const fOverride = '\\left( T_{\\text{porta-a-porta aéreo}} \\ge T_{\\text{rodoviário}} \\right) \\;\\lor\\; \\left( \\frac{D_{\\text{estádio} \\to \\text{hub}} + D_{\\text{hub} \\to \\text{estádio}}}{D_{\\text{rodoviária total}}} > 0{,}60 \\right) \\implies \\mathbf{MODAL = \\hat{O}NIBUS}';
  const fBateVolta = 'C_{\\text{viagem}} = (D_{\\text{rod}} \\times 40{,}00) + 4.800{,}00';
  const fOnibus = 'C_{\\text{viagem}} = (D_{\\text{rod}} \\times 40{,}00) + 25.000{,}00';
  const fAereo = 'C_{\\text{viagem}} = 40.000{,}00 + (D_{\\text{voo}} \\times 45{,}00) + (D_{\\text{hub\\_origem}} + D_{\\text{hub\\_destino}}) \\times 40{,}00 + 35.000{,}00';
  const fDijkstra = 'P_{AB} = \\arg\\min \\sum_{(u, v) \\in P} D_{\\text{aresta}}(u, v)';
  const fTempoAereo = 'T_{\\text{aéreo}} = \\frac{D_{\\text{voo}}}{800\\text{ km/h}} + (\\text{conexões} \\times 2{,}5\\text{ h}) + 3{,}0\\text{ h}';
  const fDetourRatio = '\\text{Detour Ratio}(u, v) = \\frac{D_{\\text{rede ANAC}}(u, v)}{D_{\\text{geodésica}}(u, v)}';
  const fTurneCPSAT = 'C_{\\text{turnê}} = \\min \\left( \\sum_{i=1}^k C(u, v_i), \\;\\; \\frac{C(u, v_1)}{2} + \\sum_{i=1}^{k-1} C_{\\text{transição}}(v_i, v_{i+1}) + \\frac{C(u, v_k)}{2} \\right)';

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
      const basePath = base ? base.replace(/\/$/, '') : '';
      const res = await fetch(`${basePath}/json/pagerank_analytics.json`);
      if (!res.ok) throw new Error('Erro ao carregar pagerank_analytics.json');
      prData = await res.json();
      prLoading = false;
    } catch (err) {
      prError = err.message;
      prLoading = false;
    }
  });

  // Unique UFs and Divisões
  $: allUfs = prData?.clubes ? [...new Set(prData.clubes.map(c => c.uf))].sort() : [];
  $: allDivisoes = prData?.clubes ? [...new Set(prData.clubes.map(c => c.divisao))].sort() : [];

  // Filtered & sorted clubs
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

  // Dynamic share calculation relative to active filters
  $: totalPrFiltrado = filteredClubes.reduce((acc, c) => acc + (c.pagerank_score || 0), 0);

  function getShareFiltrado(c) {
    if (!totalPrFiltrado || totalPrFiltrado === 0) return 0;
    return (c.pagerank_score / totalPrFiltrado) * 100;
  }

  // Filtered & sorted estados (100% PageRank Residual)
  $: sortedEstados = (() => {
    if (!prData?.estados) return [];
    let list = [...prData.estados];
    list.sort((a, b) => {
      let va = a[estadoSortKey];
      let vb = b[estadoSortKey];
      if (estadoSortKey === 'delta_residual') {
        va = a.vagas_canonicas_serie_d - a.vagas_esperadas_pr_residual;
        vb = b.vagas_canonicas_serie_d - b.vagas_esperadas_pr_residual;
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
      estadoSortDir = 'desc';
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
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
  <Navbar />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="flex flex-col lg:flex-row gap-12 items-start relative">

      <!-- STICKY SIDEBAR TABLE OF CONTENTS -->
      <aside class="hidden lg:block w-72 shrink-0 sticky top-24 self-start bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl">
        <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-3 mb-3">
          <BookOpen class="w-4 h-4" />
          Sumário do Dossiê Científico
        </div>
        <nav class="space-y-1 text-xs font-medium">
          {#each tocItems as item}
            <button
              on:click={() => scrollToSection(item.id)}
              class={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                activeSection === item.id
                  ? 'bg-indigo-950/60 text-indigo-300 font-extrabold border border-indigo-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span class="truncate">{item.label}</span>
            </button>
          {/each}
        </nav>

        <div class="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
          <p class="font-semibold text-slate-400">EMAp / FGV — TCC 2026</p>
          <p>Especificação Canônica Imutável</p>
          <p>Licença Acadêmica: MIT</p>
        </div>
      </aside>

      <!-- EDITORIAL CONTENT -->
      <article class="flex-1 max-w-3xl space-y-14 leading-relaxed text-slate-300 text-sm sm:text-base">

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 1: HERO & CREDENTIALS               -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="hero" class="space-y-6 scroll-mt-24">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase">
            <GraduationCap class="w-4 h-4" />
            Trabalho de Conclusão de Curso (TCC) — FGV EMAp (2026)
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight text-justify sm:text-left">
            Especificação Canônica: Fundamentação Matemática, Pesquisa Operacional e Teoria dos Jogos na Nova Pirâmide do Futebol Brasileiro
          </h1>

          <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed text-justify">
            Uma formulação de Pesquisa Operacional, Otimização Combinatória e Teoria dos Grafos para reestruturar a pirâmide desportiva nacional, viabilizando 244 agremiações em atividade simultânea regular sob subsídio CBF.
          </p>

          <!-- Author & Academic Credentials -->
          <div class="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs shadow-lg">
            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-indigo-400" /> Autor
              </span>
              <p class="font-bold text-white">João Gabriel Machado</p>
              <p class="text-slate-400">Arroio do Sal — RS</p>
            </div>

            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <GraduationCap class="w-3.5 h-3.5 text-indigo-400" /> Instituição
              </span>
              <p class="font-bold text-white">Fundação Getulio Vargas (FGV)</p>
              <p class="text-slate-400">Escola de Matemática Aplicada (EMAp)</p>
            </div>

            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-indigo-400" /> Formação & Ano
              </span>
              <p class="font-bold text-white">B.Sc. em Ciência de Dados e IA</p>
              <p class="text-slate-400">Ano de Conclusão: 2026</p>
            </div>

            <div class="space-y-1">
              <span class="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                <Compass class="w-3.5 h-3.5 text-indigo-400" /> Problema Central
              </span>
              <p class="font-bold text-white">Distritamento & Escalonamento</p>
              <p class="text-slate-400">Logístico sob Subsídio CBF</p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 2: ESTRATÉGIA DE DADOS & FONTES     -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="fontes" class="space-y-4 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database class="w-6 h-6 text-indigo-400" />
            2. Estratégia de Dados & Fontes: A Engenharia por Trás das Partidas
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            Diferente de abordagens baseadas em cadastros governamentais estáticos ou registros puramente nominais, o <strong>GeoFootballGraph-BR</strong> emprega um motor de dados multissetorial e automatizado para mapear as partidas, o histórico de confrontos e as coordenadas espaciais dos 876 clubes brasileiros.
          </p>

          <div class="grid grid-cols-1 gap-4 pt-1">
            <!-- 2.1 Web Scraping -->
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity class="w-4 h-4" /> 1. Web Scraping Automatizado (Dados Estaduais e Regionais)
                </span>
                <span class="text-[10px] font-mono text-slate-500">2020 — 2025 (6 temporadas)</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Diante da ausência de bases públicas estruturadas para o futebol de base e divisões inferiores, foram desenvolvidos raspadores em <strong>Selenium</strong> (em <code class="text-indigo-300">src/01_scraping</code>) para extrair dados da plataforma <a href="https://www.ogol.com.br/" target="_blank" rel="noreferrer" class="text-indigo-400 hover:underline">Ogol</a>, que audita partidas de todas as 27 federações estaduais do país.
              </p>
              <ul class="list-disc pl-5 text-xs text-slate-400 space-y-1">
                <li><strong>Escopo:</strong> Campeonatos Estaduais (1ª divisão e divisões de acesso, como a 5ª divisão em SP e 3ª em GO), Copas Estaduais e Copas Regionais (Copa Verde e Copa do Nordeste).</li>
                <li><strong>Processo:</strong> Extração automatizada de datas de partidas, placares oficiais, mando de campo e participação de clubes em seis temporadas completas de futebol competitivo.</li>
              </ul>
            </div>

            <!-- 2.2 Contribuições Externas -->
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Layers class="w-4 h-4" /> 2. Integração de Dados Nacionais
              </span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Os dados das competições de escala nacional (Séries A, B, C, D e Copa do Brasil) foram integrados a partir de repositórios abertos de alta fidelidade e auditoria acadêmica:
              </p>
              <div class="flex flex-wrap gap-2 pt-1 text-xs">
                <a href="https://github.com/BrazilianFootball/Data" target="_blank" rel="noreferrer" class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 font-mono">
                  <Github class="w-3.5 h-3.5 text-indigo-400" /> BrazilianFootball/Data
                </a>
                <a href="https://github.com/IgorMichels" target="_blank" rel="noreferrer" class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 font-mono">
                  <Github class="w-3.5 h-3.5 text-indigo-400" /> IgorMichels
                </a>
                <a href="https://github.com/maxbiostat" target="_blank" rel="noreferrer" class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 font-mono">
                  <Github class="w-3.5 h-3.5 text-indigo-400" /> MaxBiostat (FGV/EMAp)
                </a>
              </div>
            </div>

            <!-- 2.3 Geodados e Mapeamento -->
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin class="w-4 h-4" /> 3. Geodados e Mapeamento Espacial Auditado
              </span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Para converter os clubes em nós georreferenciados (<code class="text-emerald-300">lat, lon</code>), foram combinadas consultas automatizadas via <strong>Wikidata API</strong> para as cidades-sede dos estádios e um processo de refinamento e limpeza manual para equipes amadoras e semiprofissionais ausentes em bancos globais (<code class="text-slate-400">data/01_raw/all_clubs_wikidata_geodata.csv</code>).
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 3: O PARADOXO TERRITORIAL            -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="paradoxo" class="space-y-4 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock class="w-6 h-6 text-indigo-400" />
            3. O Paradoxo Territorial e o Abismo de Inatividade
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            O futebol brasileiro padece de um duplo estrangulamento estrutural:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-rose-400 block uppercase">1. O Abismo de Inatividade</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Na estrutura da CBF, apenas 60 agremiações (Séries A, B e C) possuem calendário estável de 9 meses. Para mais de 80% dos clubes profissionais do país, o ano desportivo encerra-se entre abril (término dos estaduais) e agosto (fim da 1ª fase da Série D). Isso gera o "cemitério de clubes", impondo até 8 meses de inatividade e demissão em massa de comissões técnicas e atletas.
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-amber-400 block uppercase">2. Não-Metricidade Logística</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                O modelo tradicional da Série C e D aplica cruzamentos continentais em matrizes desregionalizadas (equipes do Norte voando para o Sul com escalas múltiplas em Brasília ou Guarulhos). Com custos médios superiores a R$ 160 mil por confronto para delegações de 32 passageiros, a logística consome mais recursos do que a receita operacional gerada pelas partidas.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 4: A NOVA PIRÂMIDE                   -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="piramide" class="space-y-4 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy class="w-6 h-6 text-emerald-400" />
            4. A Nova Pirâmide Nacional Integral (244 Clubes no Total)
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            A reestruturação proposta expande o contingente de agremiações com calendário de abril a novembro de 116 para <strong>204 clubes nas Séries C e D</strong> (244 clubes em toda a pirâmide nacional):
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-amber-400 block font-mono uppercase">Série A (20 Clubes)</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Nacional, turno e returno simétrico (38 rodadas, 380 jogos). Rebaixa 4 para a B.
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-blue-400 block font-mono uppercase">Série B (20 Clubes)</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Nacional, turno e returno simétrico (38 rodadas, 380 jogos). Promove 4 para a A e rebaixa 4 para a C.
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-indigo-400 block font-mono uppercase">Nova Série C (60 Clubes)</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                4 Conferências Regionais (Sudeste 16, Nordeste 16, Sul 14, Norte-Centro 14). Turno e returno completo (26 a 30 rodadas regulares). Promove 4 para a B e rebaixa 8 para a D.
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-emerald-400 block font-mono uppercase">Nova Série D (144 Clubes)</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                18 Ligas Regionais Bounded-Radius em 4 Macrorregiões. Fase regular em turno e returno (10 a 14 rodadas) com playoffs regionais. Promove 8 para a Série C. <strong>Sem descenso para estaduais gerenciado pela CBF</strong> (a porta de entrada é mérito nos campeonatos estaduais).
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 5: PAGERANK & DOMINÂNCIA              -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="pagerank" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 class="w-6 h-6 text-indigo-400" />
            5. Teoria dos Grafos: Modelagem de PageRank e Dominância Interestadual
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify">
            A força competitiva das equipes não adota pontuações arbitrárias, mas uma formulação de Teoria dos Grafos baseada em cadeias de Markov:
          </p>

          <!-- 5A: Grafo Direcionado -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">A. Grafo Direcionado de Prestígio Esportivo</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Seja o grafo direcionado ponderado <code>G = (V, E)</code>, onde <code>V</code> são os 876 clubes cadastrados e <code>E</code> representa o histórico oficial de partidas. O fluxo de prestígio é direcionado <strong>do perdedor para o vencedor</strong> (ou bidirecional simétrico em caso de empate).
            </p>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Ponderação por Hierarquia de Competição (w)</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span class="text-amber-400 font-bold block">w = 20</span>
                  <span class="text-[10px] text-slate-400">Copa do Brasil / Série A</span>
                </div>
                <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span class="text-blue-400 font-bold block">w = 10</span>
                  <span class="text-[10px] text-slate-400">Série B</span>
                </div>
                <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span class="text-indigo-400 font-bold block">w = 5 / w = 3</span>
                  <span class="text-[10px] text-slate-400">Série C / Série D</span>
                </div>
                <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span class="text-slate-300 font-bold block">w = 3 / 2 / 1</span>
                  <span class="text-[10px] text-slate-400">Estaduais 1ª/2ª/Demais</span>
                </div>
              </div>

              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                O vetor de PageRank é obtido pela solução estacionária da equação de autovetores com fator de amortecimento &alpha; = 0,85 sobre a matriz estocástica de transição de prestígio:
              </p>
              <div class="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center text-indigo-300 overflow-x-auto">
                {@html renderMath(fPageRank)}
              </div>
            </div>
          </div>

          <!-- 5B: Macro State PageRank -->
          <div class="space-y-2">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">B. Macro State PageRank (Fluxo Interestadual)</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Calculado exclusivamente sobre o subgrafo das partidas interestaduais, mede a capacidade de uma federação exportar vitórias fora de suas fronteiras, eliminando distorções de estaduais insulares ("efeito bolha"). É utilizado para determinar quais estados possuem força competitiva suficiente para justificar mais representantes na Série D.
            </p>
          </div>

          <!-- 5C: PR Residual -->
          <div class="space-y-2">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">C. PageRank Residual Específico da Série D (A "Profundidade da Pirâmide")</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Mede a densidade técnica remanescente após <strong>descontar a massa absorvida pelos 40 clubes em A/B e pelos 60 em C</strong>:
            </p>
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-emerald-300 overflow-x-auto">
              {@html renderMath(fResidual)}
            </div>
            <p class="text-xs text-slate-400 leading-relaxed text-justify">
              Isso assegura que as vagas da Série D reflitam com fidelidade o mérito exclusivo das agremiações que competem nos campeonatos estaduais, impedindo que a força de gigantes das Séries A e B infle artificialmente a cota de clubes menores do mesmo estado.
            </p>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 6: VAGAS MULTICRITÉRIO               -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="vagas" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale class="w-6 h-6 text-indigo-400" />
            6. Otimização Multicritério das Vagas da Série D (Por que 32, 36, 36 e 40?)
          </h2>

          <!-- Tabela Multicritério -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="px-4 py-3 bg-slate-950 border-b border-slate-800">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider">Quadro Comparativo Multicritério Nacional</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th class="py-2.5 px-3">Macrorregião</th>
                    <th class="py-2.5 px-3 text-center">População</th>
                    <th class="py-2.5 px-3 text-center">Share Pop.</th>
                    <th class="py-2.5 px-3 text-center">Clubes Cadastro</th>
                    <th class="py-2.5 px-3 text-center">A/B</th>
                    <th class="py-2.5 px-3 text-center">C</th>
                    <th class="py-2.5 px-3 text-center font-bold text-white">Vagas D</th>
                    <th class="py-2.5 px-3 text-center">% Atend.</th>
                    <th class="py-2.5 px-3 text-right">Clubes / Mi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-mono text-[11px]">
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-bold text-emerald-400 font-sans">SUL-MS</td>
                    <td class="py-2 px-3 text-center">32,69 M</td>
                    <td class="py-2 px-3 text-center">16,1%</td>
                    <td class="py-2 px-3 text-center">153</td>
                    <td class="py-2 px-3 text-center">10</td>
                    <td class="py-2 px-3 text-center">14</td>
                    <td class="py-2 px-3 text-center font-bold text-white bg-indigo-950/40">32</td>
                    <td class="py-2 px-3 text-center">36,6%</td>
                    <td class="py-2 px-3 text-right text-emerald-300 font-bold">1,71</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-bold text-blue-400 font-sans">SUDESTE</td>
                    <td class="py-2 px-3 text-center">84,84 M</td>
                    <td class="py-2 px-3 text-center">41,8%</td>
                    <td class="py-2 px-3 text-center">244</td>
                    <td class="py-2 px-3 text-center">16</td>
                    <td class="py-2 px-3 text-center">16</td>
                    <td class="py-2 px-3 text-center font-bold text-white bg-indigo-950/40">36</td>
                    <td class="py-2 px-3 text-center">27,9%</td>
                    <td class="py-2 px-3 text-right">0,80</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-bold text-amber-400 font-sans">NORDESTE</td>
                    <td class="py-2 px-3 text-center">54,65 M</td>
                    <td class="py-2 px-3 text-center">26,9%</td>
                    <td class="py-2 px-3 text-center">8</td>
                    <td class="py-2 px-3 text-center">16</td>
                    <td class="py-2 px-3 text-center font-bold text-white bg-indigo-950/40">36</td>
                    <td class="py-2 px-3 text-center">24,8%</td>
                    <td class="py-2 px-3 text-right">1,10</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-bold text-purple-400 font-sans">NORTE-CENTRO</td>
                    <td class="py-2 px-3 text-center">30,89 M</td>
                    <td class="py-2 px-3 text-center">15,2%</td>
                    <td class="py-2 px-3 text-center">237</td>
                    <td class="py-2 px-3 text-center">6</td>
                    <td class="py-2 px-3 text-center">14</td>
                    <td class="py-2 px-3 text-center font-bold text-white bg-indigo-950/40">40</td>
                    <td class="py-2 px-3 text-center">25,3%</td>
                    <td class="py-2 px-3 text-right text-purple-300 font-bold">1,94</td>
                  </tr>
                  <tr class="bg-slate-950 font-bold">
                    <td class="py-2.5 px-3 text-white font-sans">BRASIL</td>
                    <td class="py-2.5 px-3 text-center">203,07 M</td>
                    <td class="py-2.5 px-3 text-center">100%</td>
                    <td class="py-2.5 px-3 text-center">876</td>
                    <td class="py-2.5 px-3 text-center">40</td>
                    <td class="py-2.5 px-3 text-center">60</td>
                    <td class="py-2.5 px-3 text-center text-emerald-400 font-black">144</td>
                    <td class="py-2.5 px-3 text-center">27,9%</td>
                    <td class="py-2.5 px-3 text-right text-white">1,20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Justificativas -->
          <div class="space-y-3 pt-2">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Justificativas Analíticas</h3>
            <div class="space-y-2 text-xs text-slate-300 leading-relaxed text-justify">
              <p>
                <strong>1. Sul-MS (32 Vagas — e por que não 36?):</strong> O Sul possui altíssima concentração de elite (21 clubes em A, B e C). O PageRank residual projeta 22,96 vagas. Expandir para 36 vagas forçaria a convocação de agremiações semi-amadoras (#350 a #450). Com 32 vagas, atinge 1,71 clubes/milhão e perfeição topológica (<code>4 × 8 = 32</code>, 4 ligas de 8 clubes sem folgas).
              </p>
              <p>
                <strong>2. Sudeste (36 Vagas — e por que não 46 ou 60?):</strong> Pela população pura, teria direito a 60 vagas; pelo PageRank residual, 46 vagas. O teto regulatório antitruste em 36 vagas impede que a Série D vire um torneio quase exclusivamente paulista e fluminense, assegurando que 100% dos classificados estejam dentro do Top 250 nacional.
              </p>
              <p>
                <strong>3. Nordeste (36 Vagas — e por que não 32?):</strong> Abriga 9 estados para 54,6M de habitantes. Como tem menos clubes em A/B (8), retém grande contingente de clubes tradicionais de alto PageRank (Santa Cruz, Treze, Botafogo-PB, América-RN, Moto Club, Central, ASA, Sergipe). Sua cota teórica residual é de 38,63 vagas. 36 vagas garantem ao menos 3 clubes em cada um dos 9 estados.
              </p>
              <p>
                <strong>4. Norte-Centro (40 Vagas):</strong> Cobre mais de 50% do território brasileiro (5 milhões de km² em 10 estados). Para assegurar viagens rodoviárias sob o teto de fadiga fisiológica de 15 horas, a região é blindada em 6 corredores fechados (4 ligas de 6 clubes e 2 ligas de 8 clubes = 40 clubes). Embora a região não tenha concentração de grandes clubes, é essencial garantir ligas localizadas para viabilizar o transporte por ônibus.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 7: TOURNAMENT DESIGN                 -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="tournament" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award class="w-6 h-6 text-purple-400" />
            7. Teoria dos Jogos e Desenho de Torneios (Tournament Design)
          </h2>

          <!-- 7A: Série C G-5 -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">A. Série C: Por que o Top-5 nos Play-ins e não o Top-2?</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Em uma conferência de 14 a 16 clubes, limitar a classificação aos 2 primeiros geraria o colapso de partidas desinteressadas (<em>dead rubbers</em>) a partir da 20ª rodada. A fórmula G-5 resolve isso:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-black text-emerald-400 block uppercase text-[11px]">Super-Incentivo do BYE (1º)</span>
                <p class="text-slate-300 leading-relaxed text-justify">
                  O líder da conferência avança diretamente às Quartas Nacionais e ganha o mando do 2º jogo. Isso mantém a liderança sob disputa renhida até a última rodada entre os 4 primeiros colocados.
                </p>
              </div>
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-black text-cyan-400 block uppercase text-[11px]">Play-ins Locais (2º ao 5º)</span>
                <p class="text-slate-300 leading-relaxed text-justify">
                  Em jogo único (<code>2º × 5º</code> e <code>3º × 4º</code>), com mando do melhor classificado. Um clube em 8º ou 9º na 25ª rodada permanece vivo na disputa. Mais de 85% dos jogos têm relevância desportiva direta até o fim.
                </p>
              </div>
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-black text-indigo-400 block uppercase text-[11px]">Quartas Nacionais (180 min)</span>
                <p class="text-slate-300 leading-relaxed text-justify">
                  O acesso à Série B é decidido em confrontos de ida e volta, equilibrando o mérito acumulado contra a variância de um jogo isolado. Os 4 semifinalistas sobem para a Série B.
                </p>
              </div>
            </div>
          </div>

          <!-- 7B: Série D - Dois Anéis -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">B. Série D: Dois Anéis Concêntricos e 8 Co-Campeões</h3>
            <div class="space-y-2 text-xs text-slate-300 leading-relaxed text-justify">
              <p>
                <strong>Anel 1 (Oitavas e Quartas Regionais):</strong> Jogos únicos disputados estritamente entre ligas vizinhas imediatas (custo de viagem rodoviário mínimo).
              </p>
              <p>
                <strong>Anel 2 (Semifinais Regionais do Acesso):</strong> Confrontos em ida e volta que consagram os 2 promovidos de cada macrorregião (<code>2 × 4 = 8</code> clubes que sobem à Série C).
              </p>
              <p>
                <strong>Extinção Racional da Final Nacional:</strong> Uma vez conquistado o acesso à Série C, a Série D encerra-se formalmente nas semifinais. Cruzar equipes de Roraima e Rio Grande do Sul para disputar uma taça simbólica de 4ª divisão consumiria mais de R$ 3 milhões em subsídios de passagens aéreas que a Pesquisa Operacional opta por poupar.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 8: O ELEVADOR FECHADO                -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="elevador" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield class="w-6 h-6 text-amber-400" />
            8. Estabilidade Institucional: O Princípio do Elevador Fechado
          </h2>

          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Um dos maiores desafios em torneios regionalizados é a contaminação territorial por descensos assimétricos. O modelo resolve essa instabilidade através de dois teoremas estruturais:
          </p>

          <!-- 8A: Invariância -->
          <div class="space-y-2">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">A. Invariância da Cardinalidade Regional (&Delta;K<sub>r</sub> = 0)</h3>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-indigo-300 overflow-x-auto">
              {@html renderMath(fElevador)}
            </div>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Em cada macrorregião, descem exatamente 2 clubes da Série C e sobem exatamente 2 clubes da Série D. Cada conferência mantém dimensão e orçamento previsíveis a cada temporada. A CBF pode negociar contratos plurianuais de fretamento de ônibus e parcerias aéreas com orçamento estável de longo prazo.
            </p>
          </div>

          <!-- 8B: Conservação Federativa -->
          <div class="space-y-2">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">B. Equação de Conservação Federativa nos Estaduais</h3>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-emerald-300 overflow-x-auto">
              {@html renderMath(fFederativa)}
            </div>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Garante que o rebaixamento de um clube da Série C não subtraia representatividade do seu estado de origem na pirâmide nacional. Se um clube do Ceará cai da Série C para a D, a cota estrutural do Ceará na D absorve esse clube, abrindo as vagas restantes via Cearense. A representatividade do estado permanece matematicamente constante.
            </p>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 9: ENGENHARIA MULTIMODAL & CUSTOS   -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="engenharia-logistica" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bus class="w-6 h-6 text-amber-400" />
            9. Engenharia Multimodal: OSRM, GeoFlight-BR e Custos Paramétricos CBF
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify text-xs">
            Todo o sistema foi concebido para eliminar "chutes" e aproximações euclidianas em linha reta, refletindo a realidade física do transporte e a contabilidade oficial da CBF para delegações profissionais de <strong>32 pessoas</strong>.
          </p>

          <!-- 9.1 Matriz de Hiperparâmetros -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">A. Limites Fisiológicos e Regulamentares</h3>
            <div class="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3 font-mono">Hiperparâmetro</th>
                    <th class="py-2.5 px-3 text-center">Valor</th>
                    <th class="py-2.5 px-3">Descrição e Justificativa Fisiológica</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300 text-xs">
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-mono text-amber-400 font-bold">FATIGUE_LIMIT_HOURS</td>
                    <td class="py-2 px-3 text-center font-bold text-white">15,0 h</td>
                    <td class="py-2 px-3">Teto contínuo de fadiga em trânsito rodoviário. Acima de 15 horas de estrada, o ônibus é estritamente vetado para garantir a integridade muscular dos atletas.</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-mono text-cyan-400 font-bold">SERIE_C_BUS_LIMIT_KM</td>
                    <td class="py-2 px-3 text-center font-bold text-white">500,0 km</td>
                    <td class="py-2 px-3">Regulamento CBF Série C. Deslocamentos de até 500 km são prioritariamente rodoviários. Acima de 500 km, avalia-se a viabilidade do modal aéreo comercial.</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-mono text-emerald-400 font-bold">SERIE_D_BUS_LIMIT_KM</td>
                    <td class="py-2 px-3 text-center font-bold text-white">700,0 km</td>
                    <td class="py-2 px-3">Regulamento CBF Série D. Torneio desenhado em corredores regionais contíguos com cidades do interior sem aeroporto (ex: Patos-PB, Catalão-GO, Ariquemes-RO).</td>
                  </tr>
                  <tr class="hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-mono text-indigo-400 font-bold">BATE_VOLTA_LIMIT_KM</td>
                    <td class="py-2 px-3 text-center font-bold text-white">200,0 km</td>
                    <td class="py-2 px-3">Raio máximo de Bate-Volta sem pernoite (até 400 km ida e volta). A delegação viaja no dia da partida e retorna à sede, dispensando custos de hotelaria.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 9.2 Override Terrestre Inteligente -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">B. A Regra do "Override Terrestre Inteligente" (Anti-Ineficiência Aérea)</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Mesmo que a distância entre dois clubes supere o teto regulamentar (500 km ou 700 km), o sistema <strong>reverte a decisão para ÔNIBUS</strong> se o voo for mais lento ou envolver traslados excessivos aos aeroportos (desde que o tempo rodoviário seja &le; 15h):
            </p>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-amber-300 overflow-x-auto">
              {@html renderMath(fOverride)}
            </div>
            <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <strong class="text-white">Exemplo Prático (Campinas &rarr; Interior do RJ, 550 km):</strong>
              <p class="text-slate-400">
                De ônibus, a viagem leva 6,5h e custa R$ 35 mil. De avião: 2h de van até Viracopos + 2h de antecedência + 1h de voo + 1h de restituição de 32 bagagens + 2,5h de ônibus até o estádio = <strong>8,5h totais a um custo de R$ 90 mil</strong>. O modelo identifica essa armadilha e força o transporte terrestre leito.
              </p>
            </div>
          </div>

          <!-- 9.3 Custos Paramétricos CBF -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">C. Formulação Contábil dos Três Modais (Delegação CBF de 32 Pessoas)</h3>
            <div class="grid grid-cols-1 gap-3 text-xs">
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-bold text-emerald-400 uppercase text-[11px]">1. Bate-Volta sem Hotel (D &le; 200 km)</span>
                <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center text-emerald-300 overflow-x-auto">
                  {@html renderMath(fBateVolta)}
                </div>
                <p class="text-slate-400 text-[11px]">Cobre R$ 40/km (R$ 20/km rodado em ida e volta) mais R$ 4.800 de alimentação e hidratação na estrada.</p>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-bold text-cyan-400 uppercase text-[11px]">2. Ônibus Leito com Pernoite (200 km &lt; D &le; 500/700 km e T &le; 15 h)</span>
                <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center text-cyan-300 overflow-x-auto">
                  {@html renderMath(fOnibus)}
                </div>
                <p class="text-slate-400 text-[11px]">Adiciona R$ 25.000 referentes a 2 diárias de hotelaria 3-4 estrelas para 32 pessoas mais alimentação completa.</p>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span class="font-bold text-indigo-400 uppercase text-[11px]">3. Modal Aéreo Comercial Multimodal Porta-a-Porta</span>
                <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center text-indigo-300 overflow-x-auto">
                  {@html renderMath(fAereo)}
                </div>
                <p class="text-slate-400 text-[11px]">Engloba R$ 40.000 de taxa fixa de emissão de grupo corporativo com franquia de carga pesada, R$ 45/km voado (32 bilhetes), traslados rodoviários até os hubs aéreos e R$ 35.000 de logística urbana e hotelaria.</p>
              </div>
            </div>
          </div>

          <!-- 9.4 GeoFlight-BR e Microdados da ANAC -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">D. Integração GeoFlight-BR e Eliminação de "Voos Fantasmas"</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Em modelos simplistas, traça-se uma linha reta entre aeroportos supondo que exista um voo direto entre quaisquer duas cidades. No Brasil, essa aproximação é fictícia:
            </p>
            <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <strong class="text-rose-400">O Caso Emblemático Macapá (SBMQ) &rarr; Boa Vista (SBBV):</strong>
              <p class="text-slate-400 leading-relaxed">
                Em linha reta distam 1.100 km. Porém, não há rodovia (Floresta Amazônica) e <strong>nunca existiu voo regular direto na história da ANAC</strong>. Um clube precisa voar a Belém ou Brasília para conectar a Manaus e depois Boa Vista, percorrendo mais de <strong>3.000 km reais em 14 horas de viagem</strong>.
              </p>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              O projeto integrou a base do <a href="https://malha-area-brasileira.netlify.app/" target="_blank" rel="noreferrer" class="text-cyan-400 hover:underline">GeoFlight-BR</a> com os microdados do Registro de Voo Regular Ativo (VRA) da ANAC:
            </p>
            <ul class="list-disc pl-5 text-xs text-slate-300 space-y-1 leading-relaxed">
              <li><strong>Grafo Real da ANAC:</strong> Apenas pares de aeroportos com frequência mínima garantida de &ge; 52 decolagens/ano (ao menos 1 voo regular semanal). Rotas sem voo comercial ativo são tratadas como custo infinito.</li>
              <li><strong>Dijkstra com Correção de Aerovia (+15%):</strong> Rota ótima no grafo aéreo somando 15% para curvas de navegação aérea e aproximações STAR/SID:
                <div class="my-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-cyan-300 overflow-x-auto">
                  {@html renderMath(fDijkstra)}
                </div>
              </li>
              <li><strong>Tempo Porta-a-Porta Real:</strong> Inclui 3,0h para despacho/restituição de 32 malas e baús de fisioterapia mais 2,5h por conexão:
                <div class="my-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-cyan-300 overflow-x-auto">
                  {@html renderMath(fTempoAereo)}
                </div>
              </li>
              <li><strong>Detour Ratio (Taxa de Desvio Geodésico):</strong> Mede o desvio entre a malha real e a linha reta, permitindo que o solver evite rotas tortuosas:
                <div class="my-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-cyan-300 overflow-x-auto">
                  {@html renderMath(fDetourRatio)}
                </div>
              </li>
            </ul>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 10: CP-SAT & TTP-k                   -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="cpsat" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity class="w-6 h-6 text-cyan-400" />
            10. Otimização Combinatória: Modelagem CP-SAT e TTP-k
          </h2>

          <!-- 10A: Distritamento -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">A. Distritamento Dinâmico Bounded-Radius (OR-Tools CP-SAT)</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Nas regiões Sul-MS, Sudeste e Nordeste, os clubes são particionados a cada ano resolvendo um problema de <code>p-Medianas</code> Capacitadas que minimiza a soma das distâncias rodoviárias reais com restrição de cardinalidade exata e contiguidade de fronteira. No Norte-Centro, os 6 corredores são blindados (fixos) pela topologia da malha viária amazônica.
            </p>
          </div>

          <!-- 10B: Escalonamento TTP-k -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">B. Escalonamento Logístico TTP-k (Traveling Tournament Problem)</h3>
            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              Resolvido via <strong>CP-SAT Monolítico</strong> com <strong>Lazy Clause Generation (LCG)</strong>, mat-heurística <strong>Large Neighborhood Search (LNS)</strong> e warm-start cíclico de Berger:
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-center">
                <span class="text-indigo-400 font-bold block">TTP-4</span>
                <span class="text-[10px] text-slate-400">Série C Sudeste</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-center">
                <span class="text-emerald-400 font-bold block">TTP-5</span>
                <span class="text-[10px] text-slate-400">Série C Sul e Nordeste</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-center">
                <span class="text-purple-400 font-bold block">TTP-6</span>
                <span class="text-[10px] text-slate-400">Série C Norte-Centro</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-center">
                <span class="text-amber-400 font-bold block">TTP-3 / TTP-4</span>
                <span class="text-[10px] text-slate-400">Série D (6-7 / 8-10 times)</span>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed text-justify">
              As janelas permitem que clubes em regiões distantes realizem 3 a 6 jogos seguidos fora em uma mesma turnê itinerante. Uma equipe de Goiás, por exemplo, viaja a Manaus e enfrenta os três adversários manauaras em sequência, eliminando dois caros voos de retorno à sede.
            </p>

            <div class="space-y-2">
              <h4 class="text-xs font-bold text-white">Regra de Transição Racional com Quebra da Desigualdade Triangular</h4>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                A emenda entre adversários fora <code>j &rarr; &ell;</code> só é realizada se for mais barata que retornar à sede:
              </p>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-indigo-300 overflow-x-auto">
                {@html renderMath(fTransicao)}
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-bold text-white">Formulação Global da Turnê no Solver</h4>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-emerald-300 overflow-x-auto">
                {@html renderMath(fTurneCPSAT)}
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-bold text-white">Twin Outliers (Praças com Múltiplos Clubes)</h4>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                O solver acopla visitas consecutivas a praças urbanas que compartilham múltiplos clubes (ex: Natal com ABC e América; Manaus com 3 clubes; Campinas e interior paulista), gerando custo de translado nulo ou puramente intra-urbano entre rodadas consecutivas.
              </p>
            </div>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 11: BALANÇO FISCAL & REPOSITÓRIOS    -->
        <!-- ═══════════════════════════════════════════ -->
        <section id="balanco" class="space-y-6 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign class="w-6 h-6 text-emerald-400" />
            11. Balanço de Eficiência e Sustentabilidade Fiscal
          </h2>

          <p class="text-slate-300 leading-relaxed text-justify text-xs">
            Os resultados do modelo frente ao sistema oficial da CBF:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-emerald-400 block uppercase">Série D</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Realiza <strong>1.096 jogos</strong> atendendo <strong>144 clubes</strong> a um custo de <strong>R$ 33,23M</strong>, contra R$ 44,89M gastos pela CBF para 542 jogos com 96 clubes. <strong class="text-emerald-400">Economia direta de R$ 11,66 milhões (-26,0%)</strong> com o dobro de partidas.
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-indigo-400 block uppercase">Série C</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Aumenta de 20 para 60 clubes (863 jogos), reduzindo o custo unitário por jogo de <strong>R$ 160.766 para R$ 58.791 (-63,4%)</strong>. O gasto total da Série C sobe de R$ 34,7M para R$ 50,7M (+46,1%).
              </p>
            </div>

            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span class="text-xs font-black text-white block uppercase">Consolidado Nacional</span>
              <p class="text-xs text-slate-300 leading-relaxed text-justify">
                Por um incremento de <strong>+13,66%</strong> no orçamento global (R$ 90,50M vs R$ 79,62M), o país viabiliza <strong>+160,2% mais jogos oficiais</strong>, estende o calendário de 4 para 8 meses e reduz em <strong>63,8%</strong> a distância média de viagem.
              </p>
            </div>
          </div>

          <!-- Repositórios -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <a
              href="https://github.com/jgabrielsg/GeoFootballGraph-BR"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer shadow-lg"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Github class="w-5 h-5 text-indigo-400" />
                    <span>GeoFootballGraph-BR</span>
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p class="text-xs text-slate-400 leading-relaxed text-justify">
                  Repositório central de engenharia: modelos em Python, solvers CP-SAT (OR-Tools LCG/LNS), raspadores Selenium e relatórios analíticos de auditoria.
                </p>
              </div>
              <span class="text-[11px] font-mono text-indigo-400 font-semibold group-hover:underline">
                github.com/jgabrielsg/GeoFootballGraph-BR
              </span>
            </a>

            <a
              href="https://github.com/jgabrielsg/Simulacao-Futebol-Brasileiro"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer shadow-lg"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Github class="w-5 h-5 text-indigo-400" />
                    <span>Simulacao-Futebol-Brasileiro</span>
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p class="text-xs text-slate-400 leading-relaxed text-justify">
                  Aplicação web interativa em SvelteKit, TailwindCSS e Leaflet.js para simulação progressiva das temporadas e visualização cartográfica de rotas.
                </p>
              </div>
              <span class="text-[11px] font-mono text-indigo-400 font-semibold group-hover:underline">
                github.com/jgabrielsg/Simulacao-Futebol-Brasileiro
              </span>
            </a>
          </div>
        </section>

        <hr class="border-slate-800/80" />

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- SECTION 12: ANALYTICS INTERATIVO DE PAGERANK                       -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <section id="analytics" class="space-y-8 scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database class="w-6 h-6 text-cyan-400" />
            12. Analytics Interativo de PageRank
          </h2>

          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Dados completos do algoritmo de PageRank com amortecimento &alpha; = 0,85 aplicado sobre os 876 clubes cadastrados. Cada clube é identificado univocamente pela tupla <strong>(Clube, UF)</strong> para evitar ambiguidades (há agremiações homônimas como Botafogo em RJ, SP, PB, BA, SE e GO, ou Santos em SP e AP).
          </p>

          {#if prLoading}
            <div class="flex items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 class="w-5 h-5 animate-spin text-indigo-400" />
              <span class="text-sm">Carregando base analítica de PageRank (354 KB)...</span>
            </div>
          {:else if prError}
            <div class="p-6 rounded-2xl bg-rose-950/30 border border-rose-800 text-rose-300 text-sm text-center">
              Erro ao carregar dados: {prError}
            </div>
          {:else if prData}

            <!-- ═══ META CARDS ═══ -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase block">Clubes Mapeados</span>
                <span class="text-xl font-black text-white">{prData.meta.total_clubes_mapeados}</span>
              </div>
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase block">UFs Auditadas</span>
                <span class="text-xl font-black text-white">{prData.meta.total_ufs}</span>
              </div>
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase block">Vagas Série D</span>
                <span class="text-xl font-black text-emerald-400">{prData.brasil_total.vagas_serie_d_canonicas}</span>
              </div>
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase block">Ano-Base</span>
                <span class="text-xl font-black text-indigo-400">{prData.meta.ano_base}</span>
              </div>
            </div>

            <!-- ═══════════════════════════════════════════ -->
            <!-- TABELA 1: RANKING DE CLUBES (876)           -->
            <!-- ═══════════════════════════════════════════ -->
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Trophy class="w-5 h-5 text-amber-400" />
                  Tabela de Clubes — Ranking de PageRank
                </h3>
                <span class="text-xs text-slate-400 font-mono">
                  {filteredClubes.length} clubes no recorte ativo
                </span>
              </div>

              <!-- Explicação do Share Dinâmico -->
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
                <Info class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p class="leading-relaxed">
                  <strong class="text-white">Share (%) Dinâmico:</strong> A coluna <strong>Share no Filtro (%)</strong> é recalculada automaticamente com base nos filtros selecionados. Se você filtrar por um estado (ex: SP), o share indica o percentual do prestígio daquele estado detido pelo clube. Ao filtrar por uma divisão (ex: Série C), indica a fatia dentro daquela divisão. Sem filtros, reflete a fatia sobre os 876 clubes do Brasil (100%).
                </p>
              </div>

              <!-- Controls / Filters -->
              <div class="flex flex-wrap items-center gap-3">
                <div class="relative flex-1 min-w-[220px]">
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
              <div class="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 z-10">
                      <tr class="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th class="py-3 px-3 cursor-pointer hover:text-white w-14" on:click={() => handleClubSort('rank')}>
                          # <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleClubSort('clube')}>
                          Clube (Identificador Único) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
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
                          <td class="py-2 px-3 text-slate-500 font-bold">{c.rank}</td>
                          <td class="py-2 px-3 font-sans font-semibold text-white">
                            {c.clube} <span class="text-slate-500 text-xs font-mono font-normal">({c.uf})</span>
                          </td>
                          <td class="py-2 px-3 font-bold text-indigo-400">{c.uf}</td>
                          <td class="py-2 px-3 font-sans">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border {divisaoBadgeClass(c.divisao)}">
                              {c.divisao}
                            </span>
                          </td>
                          <td class="py-2 px-3 font-sans text-slate-400 text-[11px] max-w-[200px] truncate">{c.liga}</td>
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
                      class="px-6 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold hover:bg-indigo-500/20 transition flex items-center gap-2 mx-auto"
                    >
                      <ChevronDown class="w-4 h-4" />
                      Carregar mais ({filteredClubes.length - displayedClubes.length} restantes)
                    </button>
                  </div>
                {:else}
                  <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                    Exibindo todos os {displayedClubes.length} clubes do recorte ativo.
                  </div>
                {/if}
              </div>
            </div>

            <!-- ═══════════════════════════════════════════ -->
            <!-- TABELA 2: COTAS POR ESTADO (100% PR RESID.) -->
            <!-- ═══════════════════════════════════════════ -->
            <div class="space-y-4 pt-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Globe class="w-5 h-5 text-emerald-400" />
                  Tabela de Estados — Calibração por PageRank Residual Específico da Série D
                </h3>
                <span class="text-xs text-slate-400 font-mono">100% Baseado no PageRank Residual</span>
              </div>

              <!-- Explicação Teórica Completa do PageRank Residual -->
              <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 space-y-3 shadow-lg">
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Shield class="w-4 h-4" /> O Que Mede o PageRank Residual Estadual?
                </div>
                <p class="text-xs text-slate-300 leading-relaxed text-justify">
                  O <strong>PageRank Residual</strong> quantifica a massa de prestígio esportivo de uma federação após <strong>descontar 100% dos clubes das Séries A, B e C</strong>:
                </p>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-emerald-300 overflow-x-auto text-xs">
                  {@html renderMath(fResidual)}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                  <div class="p-3 rounded-lg bg-slate-900/70 border border-emerald-500/20 space-y-1">
                    <span class="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 class="w-3.5 h-3.5" /> Destaque em Verde (&Delta; &ge; 0)
                    </span>
                    <p class="text-[11px] text-slate-400 leading-relaxed">
                      Estados que receberam <strong>vagas canônicas iguais ou superiores</strong> ao merecimento residual estrito. Isso ocorre para cumprir o pacto federativo (mínimo de 2 a 3 clubes por UF) e viabilizar ligas regionais contíguas em regiões com menor densidade de clubes médios (como no Norte e Centro-Oeste).
                    </p>
                  </div>

                  <div class="p-3 rounded-lg bg-slate-900/70 border border-amber-500/20 space-y-1">
                    <span class="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle class="w-3.5 h-3.5" /> Destaque em Amarelo (&Delta; &lt; 0)
                    </span>
                    <p class="text-[11px] text-slate-400 leading-relaxed">
                      Estados que receberam <strong>menos vagas que o seu valor residual bruto</strong>. Isso decorre de <strong>tetos regulatórios antitruste</strong> (caso de São Paulo, que teria direito a 14,38 vagas e foi fixado em 14), evitando a colonização excessiva da Série D por agremiações de uma única federação.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Estado Table -->
              <div class="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 z-10">
                      <tr class="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleEstadoSort('uf')}>
                          UF <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleEstadoSort('nome')}>
                          Estado <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 cursor-pointer hover:text-white" on:click={() => handleEstadoSort('macro_regiao')}>
                          Macro <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-right cursor-pointer hover:text-white" on:click={() => handleEstadoSort('populacao_ibge')}>
                          População IBGE <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white font-bold text-indigo-400" on:click={() => handleEstadoSort('vagas_esperadas_pr_residual')}>
                          Vagas Esperadas (PR Residual) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white font-bold text-white bg-slate-950/80" on:click={() => handleEstadoSort('vagas_canonicas_serie_d')}>
                          Cota Canônica Série D <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
                        </th>
                        <th class="py-3 px-3 text-center cursor-pointer hover:text-white" on:click={() => handleEstadoSort('delta_residual')}>
                          Balanço (&Delta; Canônico vs Residual) <ArrowUpDown class="w-3 h-3 inline ml-0.5 opacity-60" />
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
                        <tr class="hover:bg-slate-800/40 transition font-mono">
                          <td class="py-2 px-3 font-bold text-indigo-400">{e.uf}</td>
                          <td class="py-2 px-3 font-sans font-medium text-white">{e.nome}</td>
                          <td class="py-2 px-3 font-sans text-slate-400 text-[11px]">{e.macro_regiao}</td>
                          <td class="py-2 px-3 text-right text-slate-400">{e.populacao_ibge.toLocaleString('pt-BR')}</td>
                          <td class="py-2 px-3 text-center font-bold text-indigo-300">{fmtNum(e.vagas_esperadas_pr_residual)}</td>
                          <td class="py-2 px-3 text-center font-black text-white bg-slate-950/40 text-sm">{e.vagas_canonicas_serie_d}</td>
                          <td class="py-2 px-3 text-center">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border {isMaiorQueMerecido ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}">
                              {#if isMaiorQueMerecido}
                                <Check class="w-3 h-3" />
                                +{fmtNum(deltaResidual)} (Vagas &ge; PR)
                              {:else}
                                <AlertTriangle class="w-3 h-3" />
                                {fmtNum(deltaResidual)} (Teto Antitruste)
                              {/if}
                            </span>
                          </td>
                          <td class="py-2 px-3 text-right text-slate-400">{fmtNum(e.clubes_por_milhao)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4">
                  <span>Auditadas as 27 Unidades da Federação e 144 vagas da Série D.</span>
                  <span class="text-emerald-400 font-semibold">100% dos estados possuem representação garantida na Pirâmide Nacional.</span>
                </div>
              </div>
            </div>

          {/if}
        </section>

      </article>

    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
    <p class="font-semibold text-slate-400">GeoFootballGraph-BR — Trabalho de Conclusão de Curso (TCC)</p>
    <p class="text-[11px] text-slate-600 mt-1">Escola de Matemática Aplicada (EMAp) — Fundação Getulio Vargas (FGV, Rio de Janeiro)</p>
  </footer>
</div>
