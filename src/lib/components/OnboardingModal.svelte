<script>
  import { onMount } from 'svelte';
  import { Compass, MapPin, Trophy, ArrowRight, ArrowLeft, CheckCircle2, X, Navigation, Play } from 'lucide-svelte';
  import { loadSeason } from '$lib/stores/gameStore.js';

  export let isOpen = false;

  let currentStep = 0;

  const steps = [
    {
      title: "Simulador de Reestruturação Logística",
      subtitle: "Pesquisa Operacional Aplicada ao Futebol Brasileiro (TCC)",
      description: "Esta plataforma apresenta os resultados de 5 temporadas otimizadas via Pesquisa Operacional (CP-SAT, LNS e TTP-k). O objetivo é demonstrar a viabilidade econômica e esportiva de um calendário sustentável para as Séries C e D, com redução de custos e preservação de limites fisiológicos de viagem.",
      icon: Compass,
      highlight: "Otimização Combinatória • 5 Temporadas Determinísticas"
    },
    {
      title: "Simulação Progressiva & Viagens TTP-k",
      subtitle: "Turnês Sequenciais e Matriz Modal",
      description: "Utilize os controles de avanço ('Simular 1 Rodada' ou 'Simular Toda a Fase') para calcular os resultados progressivamente. No mapa, observe as rotas rodoviárias e os trechos de turnê TTP-k, onde os clubes realizam partidas fora consecutivas sem retorno à sede, gerando economias substanciais.",
      icon: Navigation,
      highlight: "Teto de Fadiga de 15h • Ônibus Regional e Aéreo Compulsório"
    },
    {
      title: "Playoffs, Acessos & Invariância Federativa",
      subtitle: "Estrutura de Mata-Matas e Cotas Estaduais",
      description: "Acompanhe os play-ins locais e as decisões de acesso na Série C (Nacional dos 8) e Série D (8 acessos regionais). A cada encerramento de temporada, o wizard de transição consolida o balanço da pirâmide e desbloqueia a temporada seguinte com preservação das cotas das 27 federações.",
      icon: Trophy,
      highlight: "Equilíbrio Esportivo • Invariância Federativa Preservada"
    }
  ];

  onMount(() => {
    const hasSeen = localStorage.getItem('geo_onboarding_seen_master');
    if (!hasSeen) {
      isOpen = true;
    }
  });

  function closeOnboarding() {
    localStorage.setItem('geo_onboarding_seen_master', 'true');
    isOpen = false;
    loadSeason(1, true);
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep += 1;
    } else {
      closeOnboarding();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep -= 1;
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
    
    <div class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-150">
      
      <!-- Close Button -->
      <button
        on:click={closeOnboarding}
        class="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        title="Fechar"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Step Counter Indicators -->
      <div class="flex items-center gap-1.5">
        {#each steps as _, idx}
          <div class={`h-1 rounded-full transition-all duration-300 ${
            currentStep === idx ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'
          }`}></div>
        {/each}
        <span class="text-[9px] font-mono font-bold text-slate-500 ml-1.5">
          {currentStep + 1} de {steps.length}
        </span>
      </div>

      <!-- Icon & Title -->
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-md shrink-0">
          <svelte:component this={steps[currentStep].icon} class="w-4 h-4" />
        </div>

        <div>
          <h3 class="text-base font-black text-white tracking-tight leading-snug">
            {steps[currentStep].title}
          </h3>
          <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">
            {steps[currentStep].subtitle}
          </p>
        </div>
      </div>

      <!-- Description Body -->
      <p class="text-xs text-slate-300 leading-relaxed text-justify">
        {steps[currentStep].description}
      </p>

      <!-- Highlight Banner -->
      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{steps[currentStep].highlight}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-800">
        <button
          on:click={prevStep}
          disabled={currentStep === 0}
          class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white disabled:opacity-20 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" /> Voltar
        </button>

        <button
          on:click={nextStep}
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {#if currentStep < steps.length - 1}
            Próximo <ArrowRight class="w-3.5 h-3.5" />
          {:else}
            Iniciar Temporada 1 <Play class="w-3 h-3 fill-current text-amber-300" />
          {/if}
        </button>
      </div>

    </div>

  </div>
{/if}
