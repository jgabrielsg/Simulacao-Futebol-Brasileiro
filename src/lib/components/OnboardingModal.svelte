<script>
  import { onMount } from 'svelte';
  import { Compass, MapPin, Trophy, ArrowRight, ArrowLeft, CheckCircle2, X, Sparkles, Layers } from 'lucide-svelte';

  export let isOpen = false;

  let currentStep = 0;

  const steps = [
    {
      title: "Bem-vindo ao Simulador Logístico",
      subtitle: "Reestruturação do Futebol Brasileiro",
      description: "Aqui você interage diretamente com o modelo de IA que reestrutura as divisões brasileiras. As Séries A e B continuam nacionais, enquanto as Séries C e D foram totalmente regionalizadas para garantir calendário o ano inteiro e reduzir custos operacionais.",
      icon: Compass,
      highlight: "Otimização de Calendário & Sobrevivência de Clubes Periféricos"
    },
    {
      title: "Foque nas Séries C e D (Ligas Regionais)",
      subtitle: "Navegação por Macrorregiões e Microrregiões",
      description: "Utilize o painel lateral para alternar entre as 4 Macrorregiões da Série C e as 12 Microrregiões da Série D. Observe no mapa Leaflet como as partidas ocorrem em raios geográficos curtos, eliminando viagens exaustivas de ponta a ponta do país.",
      icon: MapPin,
      highlight: "Redução de até 60% na distância percorrida por viagem"
    },
    {
      title: "Avanço no Tempo e Alocação Inteligente",
      subtitle: "Promoções, Rebaixamentos e Algoritmo de Alocação",
      description: "Clique em 'Simular Rodada' ou 'Simular Ano' para gerar as partidas. Ao concluir o ano, clique em 'Virar Temporada' para ver o modelo re-alocando geograficamente os clubes promovidos e rebaixados de forma automática sem destruir a simetria das ligas.",
      icon: Trophy,
      highlight: "Motor Matemático de Atribuição Linear contínua"
    }
  ];

  onMount(() => {
    const hasSeen = localStorage.getItem('geo_onboarding_seen_v1');
    if (!hasSeen) {
      isOpen = true;
    }
  });

  function closeOnboarding() {
    localStorage.setItem('geo_onboarding_seen_v1', 'true');
    isOpen = false;
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
  <!-- Backdrop Overlay -->
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-slate-950 animate-fade-in">
    
    <!-- Modal Card Container -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      <!-- Subtle Accent Background Glow -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header & Close Button -->
      <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
            <svelte:component this={steps[currentStep].icon} class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <h3 class="text-lg font-black text-white leading-tight">
              {steps[currentStep].title}
            </h3>
          </div>
        </div>

        <button
          on:click={closeOnboarding}
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar Tutorial"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Step Content Description -->
      <div class="space-y-4">
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
          {steps[currentStep].description}
        </p>

        <!-- Highlight Box -->
        <div class="bg-slate-950 border border-indigo-950/60 rounded-xl p-3 flex items-center gap-2.5 text-xs text-indigo-300 font-semibold">
          <Sparkles class="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{steps[currentStep].highlight}</span>
        </div>
      </div>

      <!-- Progress Indicator Dots & Navigation Actions -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        
        <!-- Step Dots -->
        <div class="flex items-center gap-1.5">
          {#each steps as _, idx}
            <div
              class={`h-1.5 rounded-full transition-all ${
                idx === currentStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'
              }`}
            ></div>
          {/each}
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-2">
          {#if currentStep > 0}
            <button
              on:click={prevStep}
              class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <ArrowLeft class="w-3.5 h-3.5" /> Anterior
            </button>
          {/if}

          {#if currentStep < steps.length - 1}
            <button
              on:click={nextStep}
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/60 transition-all cursor-pointer"
            >
              Próximo <ArrowRight class="w-3.5 h-3.5" />
            </button>
          {:else}
            <button
              on:click={closeOnboarding}
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <CheckCircle2 class="w-3.5 h-3.5" /> Entendi, iniciar simulação
            </button>
          {/if}
        </div>

      </div>

    </div>
  </div>
{/if}
