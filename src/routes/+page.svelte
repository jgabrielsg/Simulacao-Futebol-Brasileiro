<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import {
    Compass, Shield, MapPin, Award, ArrowRight, Play, CheckCircle2,
    BarChart3, TrendingDown, DollarSign, BookOpen, Clock, AlertTriangle,
    LayoutDashboard, Layers, RefreshCw, Bus, Plane, Trophy,
    Users, Check, Globe, Activity, ArrowUpRight
  } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
  <Navbar />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-20">
    
    <!-- HERO SECTION -->
    <div class="text-center max-w-4xl mx-auto space-y-6">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold tracking-wide">
        <Compass class="w-4 h-4 text-indigo-400" />
        Trabalho de Conclusão de Curso — FGV EMAp (2026)
      </div>

      <h1 class="text-3xl sm:text-5xl lg:text-4xl font-black tracking-tight text-white leading-tight">
        A Nova Pirâmide do Futebol Brasileiro: Otimização Logística e Expansão de Calendário
      </h1>

      <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto text-justify sm:text-center">
        Uma formulação de Pesquisa Operacional, Otimização Combinatória e Teoria dos Grafos para reestruturar as divisões nacionais de acesso, eliminando o desemprego sazonal de 8 meses e reduzindo custos de deslocamento por partida em 56,3% sob o subsídio logístico centralizado da CBF.
      </p>

      <!-- CTA Hierarchy -->
      <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
        <!-- Primary CTA: Estudo de Caso -->
        <a
          href="/estudo-de-caso"
          class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <BarChart3 class="w-5 h-5 text-white" />
          Estudo de Caso & Impacto Financeiro
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        <!-- Secondary CTA: Metodologia -->
        <a
          href="/metodologia"
          class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <BookOpen class="w-5 h-5 text-indigo-400" />
          Metodologia & Modelagem Matemática
        </a>

        <!-- Tertiary CTA: Simulador -->
        <a
          href="/dashboard"
          class="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LayoutDashboard class="w-4 h-4 text-indigo-400" />
          Simulador Interativo
        </a>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
          <span class="text-xl sm:text-2xl font-black text-indigo-400 font-mono block">244</span>
          <span class="text-[11px] text-slate-400 font-semibold">Clubes na Pirâmide</span>
        </div>
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
          <span class="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">1.972</span>
          <span class="text-[11px] text-slate-400 font-semibold">Jogos no Ano (+160%)</span>
        </div>
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
          <span class="text-xl sm:text-2xl font-black text-cyan-400 font-mono block">-56,3%</span>
          <span class="text-[11px] text-slate-400 font-semibold">Custo Médio / Jogo</span>
        </div>
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-center">
          <span class="text-xl sm:text-2xl font-black text-amber-400 font-mono block">80,9%</span>
          <span class="text-[11px] text-slate-400 font-semibold">Modal Rodoviário</span>
        </div>
      </div>
    </div>

    <!-- PIRÂMIDE NACIONAL INTEGRAL (244 CLUBES ATIVOS) -->
    <section class="space-y-6">
      <div class="text-center max-w-3xl mx-auto space-y-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold">
          <Trophy class="w-3.5 h-3.5" />
          Especificação Metodológica (2026)
        </div>
        <h2 class="text-2xl sm:text-3xl font-black text-white">A Pirâmide Integral do Futebol Nacional</h2>
        <p class="text-xs sm:text-sm text-slate-400">
          Estrutura de 244 agremiações em atividade simultânea regular sob subsídio CBF com delegação padrão de 32 passageiros.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Série A -->
        <div class="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-3 transition-all">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs border border-amber-500/30">
              SÉRIE A
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono">20 Clubes</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Escopo Nacional em turno e returno com 38 rodadas simétricas. Os 4 últimos colocados são rebaixados para a Série B.
          </p>
          <div class="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono">
            <div class="flex justify-between"><span>Partidas:</span><strong class="text-white">380</strong></div>
            <div class="flex justify-between"><span>Acesso/Descenso:</span><strong class="text-rose-400">4 descensos</strong></div>
          </div>
        </div>

        <!-- Série B -->
        <div class="bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 space-y-3 transition-all">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 font-black text-xs border border-blue-500/30">
              SÉRIE B
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono">20 Clubes</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Escopo Nacional em turno e returno com 38 rodadas simétricas. Os 4 primeiros sobem para a A; os 4 últimos caem para a C.
          </p>
          <div class="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono">
            <div class="flex justify-between"><span>Partidas:</span><strong class="text-white">380</strong></div>
            <div class="flex justify-between"><span>Acesso/Descenso:</span><strong class="text-emerald-400">4 sobem / 4 caem</strong></div>
          </div>
        </div>

        <!-- Série C -->
        <div class="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 space-y-3 transition-all">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-xs border border-indigo-500/30">
              SÉRIE C
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono">60 Clubes</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            4 Conferências Regionais (Sul 14, Sudeste 16, Nordeste 16, Norte-Centro 14). Play-ins regionais e Quartas Nacionais de Acesso.
          </p>
          <div class="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono">
            <div class="flex justify-between"><span>Partidas:</span><strong class="text-white">870</strong></div>
            <div class="flex justify-between"><span>Acesso/Descenso:</span><strong class="text-emerald-400">4 sobem / 8 caem</strong></div>
          </div>
        </div>

        <!-- Série D -->
        <div class="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-3 transition-all">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-black text-xs border border-emerald-500/30">
              SÉRIE D
            </span>
            <span class="text-xs font-bold text-slate-400 font-mono">144 Clubes</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            18 Ligas Regionais em 4 Macrorregiões. Playoffs em Dois Anéis Concêntricos. Sem descenso CBF; renovação via Estaduais.
          </p>
          <div class="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono">
            <div class="flex justify-between"><span>Partidas:</span><strong class="text-white">1.102</strong></div>
            <div class="flex justify-between"><span>Acesso:</span><strong class="text-emerald-400">8 sobem p/ Série C</strong></div>
          </div>
        </div>

      </div>
    </section>

    <!-- TABELA COMPARATIVA MESTRE: CBF 2026 VS MODELO -->
    <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Auditoria Logística & Orçamentária</span>
          <h3 class="text-xl sm:text-2xl font-black text-white">Modelo Tradicional CBF (2026) vs. Nova Pirâmide Proposta</h3>
        </div>
        <a
          href="/estudo-de-caso"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all self-start md:self-auto cursor-pointer"
        >
          Ver Detalhes por Clube <ArrowRight class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">Dimensão de Avaliação</th>
              <th class="py-3 px-4 text-center">Modelo Oficial CBF (2026)</th>
              <th class="py-3 px-4 text-center">Proposta de Pirâmide (2026)</th>
              <th class="py-3 px-4 text-right">Variação / Eficiência</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70 font-medium">
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Clubes Ativos no Acesso (C + D)</td>
              <td class="py-3 px-4 text-center font-mono text-slate-400">116 clubes (C: 20, D: 96)</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">204 clubes (C: 60, D: 144)</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">+88 clubes (+75,9%)</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Clubes na Pirâmide Nacional Estruturada</td>
              <td class="py-3 px-4 text-center font-mono text-slate-400">156 clubes</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">244 clubes</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">Atendimento pleno do ecossistema</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Volume Total de Partidas no Ano</td>
              <td class="py-3 px-4 text-center font-mono text-slate-400">758 partidas (C: 216, D: 542)</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">1.972 partidas (C: 870, D: 1.102)</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">+1.214 partidas (+160,2%)</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Garantia de Atividade Anual</td>
              <td class="py-3 px-4 text-center font-mono text-amber-400">19 jogos na série C</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">26 a 30 jogos na série C</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">Fim da inatividade sazonal</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Custo Médio Global por Jogo</td>
              <td class="py-3 px-4 text-center font-mono text-rose-400">R$ 105.036,56</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">R$ 45.890,91</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">-56,31% de redução unitária</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Distância Média de Viagem por Jogo</td>
              <td class="py-3 px-4 text-center font-mono text-rose-400">1.267,5 km</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">458,7 km</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">-808,8 km (-63,81%)</td>
            </tr>
            <tr class="hover:bg-slate-800/40">
              <td class="py-3 px-4 font-bold text-white">Participação do Modal Rodoviário</td>
              <td class="py-3 px-4 text-center font-mono text-slate-400">44,1% (334 jogos)</td>
              <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">80,9% (1.595 jogos)</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-emerald-300">+1.261 jogos via ônibus leito</td>
            </tr>
            <tr class="hover:bg-slate-800/40 bg-slate-950/60">
              <td class="py-3.5 px-4 font-black text-white text-sm">Orçamento Anual Consolidado (C + D)</td>
              <td class="py-3.5 px-4 text-center font-mono font-bold text-slate-300">R$ 79.617.713,03</td>
              <td class="py-3.5 px-4 text-center font-mono font-black text-emerald-400 text-sm">R$ 90.496.872,48</td>
              <td class="py-3.5 px-4 text-right font-mono font-extrabold">+13,66% de investimento</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- OS 4 PILARES DA METODOLOGIA CIENTÍFICA -->
    <section class="space-y-6">
      <div class="text-center max-w-3xl mx-auto space-y-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Layers class="w-3.5 h-3.5" />
          Pesquisa Operacional & Engenharia Matemática
        </div>
        <h2 class="text-2xl sm:text-3xl font-black text-white">Os 4 Pilares Científicos da Reestruturação</h2>
        <p class="text-xs sm:text-sm text-slate-400">
          Modelagem desenvolvida combinando solvers exatos, mat-heurísticas e ciência de dados, 
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Pilar 1 -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Layers class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">1. Distritamento Dinâmico Bounded-Radius (CP-SAT)</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            No Sul-MS, Sudeste e Nordeste, as ligas da Série D não são confinadas a fronteiras políticas rígidas. O modelo aplica otimização por medoides de raio limitado (CP-SAT), minimizando distâncias terrestres e acomodando a contiguidade natural (Triângulo Mineiro com Interior de SP, Oeste do PR com MS). No Norte-Centro, 6 corredores canônicos blindados protegem os atletas do isolamento amazônico.
          </p>
        </div>

        <!-- Pilar 2 -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Activity class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">2. Escalonamento Logístico SOTA (TTP-k via LCG/LNS)</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            O calendário resolve o <em>Traveling Tournament Problem</em> (TTP) com um solver CP-SAT monolítico acelerado por <em>Lazy Clause Generation</em> e <em>Large Neighborhood Search</em> (LNS). O algoritmo encadeia turnês com janelas fisiológicas restritas (TTP-3 a TTP-6) e aplica a regra de transição racional, economizando mais de R$ 31 milhões em passagens ao eliminar retornos desnecessários à sede.
          </p>
        </div>

        <!-- Pilar 3 -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Shield class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">3. Invariância Territorial</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            A pirâmide garante que todas as 27 UFs tenham representação ativa (&ge; 2 clubes). A Série D não tem rebaixamento nacional: as vagas são preenchidas pelos campeonatos estaduais segundo cotas invariantes. O modelo estocástico de classificação nos estaduais (através de pageranks das federações estaduais) premia a meritocracia histórica, mas reproduz a ascensão real de "zebras".
          </p>
        </div>

        <!-- Pilar 4 -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Clock class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">4. Fisiologia do Atleta & Mitigação Climática</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            O regulamento impõe um teto estrito de 15 horas para trajetos terrestres (tornando o voo compulsório para trechos superiores). Viagens rodoviárias de até 200 km operam em bate-volta sem hospedagem. A migração massiva para ônibus leito (80,9%) e o corte de 63,8% na quilometragem média encurtam o desgaste físico dos atletas e reduzem drasticamente as emissões de carbono do futebol.
          </p>
        </div>

      </div>
    </section>

    <!-- RECURSOS DA PLATAFORMA DE SIMULAÇÃO -->
    <section class="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-xl font-extrabold text-white">Recursos da Plataforma de Simulação</h3>
          <p class="text-xs text-slate-400">Funcionalidades do simulador interativo para exploração tática, logística e esportiva.</p>
        </div>

        <a
          href="/dashboard"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Play class="w-3.5 h-3.5 fill-current" /> Acessar Simulador
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300">
        
        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <Layers class="w-4 h-4 text-indigo-400" />
            <span>Simulação em 3 Fases</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Acompanhe a fase de grupos rodada a rodada, os play-ins locais eliminatórios e os playoffs decisivos valendo o acesso nacional.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <MapPin class="w-4 h-4 text-emerald-400" />
            <span>Cartografia Vetorial & Rotas</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Mapas Leaflet com traçado exato de itinerários aéreos e rodoviários, clusters regionais e rotas de turnês encadeadas TTP-k.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <BarChart3 class="w-4 h-4 text-cyan-400" />
            <span>Métricas e Auditoria de Custos</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Cálculo instantâneo de orçamentos por delegação de 32 passageiros, quilometragem acumulada e detalhamento financeiro por partida.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <RefreshCw class="w-4 h-4 text-amber-400" />
            <span>Transições Anuais & Iso-Ligas</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Controle do elevador de acessos/descensos com balanceamento de clubes-ponte (Iso-Ligas) entre conferências da Série C.
          </p>
        </div>

      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
    <p class="font-semibold text-slate-400">GeoFootballGraph-BR — Trabalho de Conclusão de Curso (TCC)</p>
    <p class="text-[11px] text-slate-600 mt-1">Escola de Matemática Aplicada (EMAp) — Fundação Getulio Vargas (FGV, Rio de Janeiro)</p>
  </footer>
</div>
