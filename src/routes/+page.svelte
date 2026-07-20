<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import { Compass, Shield, MapPin, Award, ArrowRight, Play, Cpu, Network, CheckCircle2 } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
  <Navbar />

  <!-- Hero Section -->
  <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="text-center max-w-3xl mx-auto space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
        <Compass class="w-4 h-4 animate-spin-slow" />
        TCC FGV - Reestruturação Logística do Futebol Brasileiro
      </div>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
        Simulador Logístico das Divisões do Futebol Brasileiro
      </h1>

      <p class="text-lg text-slate-300 leading-relaxed">
        Uma aplicação interativa para visualização e simulação dos modelos de otimização logística das Séries A, B, C e D do futebol brasileiro. Utiliza algoritmos de <strong class="text-emerald-400">Clusterização Geográfica (Balanced K-Means)</strong> e <strong class="text-purple-400">Teoria dos Grafos (PageRank)</strong>.
      </p>

      <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="/dashboard"
          class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Play class="w-5 h-5 fill-current" />
          Iniciar Simulação no Dashboard
          <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>

    <!-- Methodology Cards Section -->
    <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Card 1: Balanced K-Means -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
          <Cpu class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Balanced K-Means</h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Reestruturação regional das Séries C (4 macrorregiões de 20 times) e D (12 microrregiões de 18 times), garantindo equilíbrio numérico de equipes e minimizando o deslocamento terrestre e aéreo.
        </p>
      </div>

      <!-- Card 2: PageRank & Ponderação -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
          <Network class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">PageRank dos Clubes</h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Aplicação de Teoria dos Grafos baseada em dados históricos dos confrontos do futebol brasileiro para ranquear e ponderar a competitividade técnica e estocástica dos placares no motor de jogos.
        </p>
      </div>

      <!-- Card 3: Hubs Aeroportuários -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
          <MapPin class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Malha Logística de Hubs</h3>
        <p class="text-sm text-slate-400 leading-relaxed">
          Cálculo prévio das rotas e do aeroporto hub mais próximo de cada sede de clube (limiar de 800 km para transição entre viagens terrestres de ônibus e aéreas multi-leg).
        </p>
      </div>
    </div>

    <!-- Highlights / Key Features List -->
    <div class="mt-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 max-w-4xl mx-auto">
      <h3 class="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
        <Award class="w-5 h-5 text-amber-400" />
        Funcionalidades da Simulação (Football Manager Analytics):
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Motor estocástico de partidas com distribuição de Poisson baseada no PageRank.</span>
        </div>
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Re-clusterização regional gulosa (Greedy Assignment) nas Séries C e D durante viradas de temporada.</span>
        </div>
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Mapa interativo Leaflet com traçado de voos em arco e translados para aeroportos hubs.</span>
        </div>
        <div class="flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Escudos dos times com carregamento assíncrono e fallback dinâmico em SVG.</span>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
    <p>TCC Fundação Getulio Vargas (FGV) - Modelo de Otimização Logística do Futebol Brasileiro</p>
  </footer>
</div>
