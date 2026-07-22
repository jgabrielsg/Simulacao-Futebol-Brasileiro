<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import {
    Compass, Shield, MapPin, Award, ArrowRight, Play, CheckCircle2,
    BarChart3, TrendingDown, DollarSign, BookOpen, Clock, AlertTriangle,
    Sparkles, LayoutDashboard, Layers, RefreshCw
  } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-slate-950">
  <Navbar />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
    
    <!-- HERO SECTION (Value Proposition Inversion: Problem & Solution First) -->
    <div class="text-center max-w-4xl mx-auto space-y-6">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <Compass class="w-4 h-4 text-indigo-400" />
        Estudo de Caso Acadêmico — FGV EMAp (2026)
      </div>

      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
        Viabilizando o Futebol Periférico: Otimização Logística e Expansão de Calendário
      </h1>

      <p class="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto text-justify sm:text-center">
        Uma plataforma baseada em Inteligência Artificial para reestruturar as divisões do futebol brasileiro, eliminando distâncias continentais e garantindo a sobrevivência financeira de clubes menores.
      </p>

      <!-- CTA Hierarchy (Primary: Case Study -> Secondary: Methodology -> Tertiary: Dashboard) -->
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        
        <!-- Primary CTA: Estudo de Caso -->
        <a
          href="/estudo-de-caso"
          class="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-950/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <BarChart3 class="w-5 h-5 text-white" />
          Ver Impacto Financeiro (Estudo de Caso)
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        <!-- Secondary CTA: Metodologia -->
        <a
          href="/metodologia"
          class="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <BookOpen class="w-5 h-5 text-indigo-400" />
          Entender a Metodologia
        </a>

        <!-- Tertiary CTA: Simulador -->
        <a
          href="/dashboard"
          class="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-indigo-500/30 text-indigo-300 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LayoutDashboard class="w-4 h-4 text-indigo-400" />
          Acessar Simulador Interativo
        </a>

      </div>
    </div>

    <!-- NEW SECTION: O PROBLEMA VS. A SOLUÇÃO (3 Visual Cards) -->
    <section class="space-y-6">
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <h2 class="text-2xl font-black text-white">O Cenário Atual do Futebol Brasileiro</h2>
        <p class="text-xs sm:text-sm text-slate-400">Por que o modelo tradicional sufoca clubes periféricos e como a matemática pode salvar o esporte.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Card 1: Inatividade -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Clock class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">Inatividade Prolongada</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Mais de 80% dos clubes brasileiros ficam inativos após os campeonatos estaduais, paralisando o futebol profissional por até 8 meses no ano e desempregando atletas e comissões técnicas.
          </p>
        </div>

        <!-- Card 2: Ruína Financeira -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">Ruína Financeira na Série D</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Na Série D atual, o custo de deslocamento para regiões distantes frequentemente supera toda a arrecadação obtida pelas equipes com bilheteria, gerando déficits operacionais crônicos.
          </p>
        </div>

        <!-- Card 3: A Solução Inteligente -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Sparkles class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-white">Regionalização Inteligente</h3>
          <p class="text-xs text-slate-300 leading-relaxed text-justify">
            Nossa regionalização matemática garante calendário anual estável reduzindo o custo por partida jogada pela metade, mantendo os clubes financeiramente viáveis e competitivos.
          </p>
        </div>

      </div>
    </section>

    <!-- FEATURE HIGHLIGHTS (Business & Platform Capabilities) -->
    <section class="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-xl font-extrabold text-white">Recursos da Plataforma de Simulação</h3>
          <p class="text-xs text-slate-400">Funcionalidades do simulador interativo para gestão e otimização de ligas.</p>
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
            <span>Alocação Automática de Ligas</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Organização das Séries C e D em ligas regionais simétricas com capacidade equilibrada de clubes por macrorregião.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <BarChart3 class="w-4 h-4 text-indigo-400" />
            <span>Simulação de Partidas</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Simulação de rodadas em tempo real com cálculo de pontos, saldos de gol e tabelas de classificação atualizadas.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <MapPin class="w-4 h-4 text-indigo-400" />
            <span>Redução Logística e Modais</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Divisão inteligente entre fretamento rodoviário de ônibus e passagens aéreas comerciais com base na distância da rota.
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 font-bold text-white">
            <RefreshCw class="w-4 h-4 text-indigo-400" />
            <span>Virada de Temporada Automática</span>
          </div>
          <p class="text-slate-400 leading-relaxed text-justify">
            Re-alocação automática de clubes promovidos e rebaixados ao fim da temporada sem desmanchar o mapa regional.
          </p>
        </div>

      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
    <p>GeoFootGraph-BR — Trabalho de Conclusão de Curso (TCC)</p>
    <p class="text-[11px] text-slate-600 mt-1">Escola de Matemática Aplicada (EMAp) — Fundação Getulio Vargas (FGV)</p>
  </footer>
</div>
