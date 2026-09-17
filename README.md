# GeoFootGraph-BR: Otimização Logística e Reestruturação da Pirâmide do Futebol Brasileiro

[![Deploy Status](https://img.shields.io/badge/Netlify-Deployed-00C7B7?logo=netlify&logoColor=white)](https://simulacao-divisoes-futebol-brasileiro.netlify.app/)
[![Framework](https://img.shields.io/badge/SvelteKit-v2-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Optimization](https://img.shields.io/badge/Google_OR--Tools-CP--SAT-4285F4?logo=google&logoColor=white)](https://developers.google.com/optimization)
[![GIS](https://img.shields.io/badge/OSRM_%26_Leaflet-GIS_Routing-199900?logo=openstreetmap&logoColor=white)](https://project-osrm.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Aplicação Interativa em Produção:** [simulacao-divisoes-futebol-brasileiro.netlify.app](https://simulacao-divisoes-futebol-brasileiro.netlify.app/)

---

## 1. Identificação Acadêmica & Autoria

* **Autor:** João Gabriel Machado (Arroio do Sal — RS)
* **Trabalho de Conclusão de Curso (TCC):** Bacharelado em Ciência de Dados e Inteligência Artificial
* **Instituição de Ensino:** Escola de Matemática Aplicada — Fundação Getulio Vargas (FGV EMAp)
* **Ano:** 2026
* **Áreas de Concentração:** Pesquisa Operacional, Teoria dos Grafos, Ciência de Redes, Otimização Combinatória e Inteligência Espacial (GIS).

---

## 2. Visão Geral: O Paradoxo Territorial Brasileiro

O Brasil possui dimensões continentais (mais de 8,5 milhões de km²), o que impõe desafios logísticos severos às competições esportivas. No modelo vigente organizado pela Confederação Brasileira de Futebol (CBF):

1. **Vácuo de Calendário Anual:** O calendário nacional integral é assegurado apenas para 60 agremiações (Séries A, B e C). Na Série C atual, os clubes têm apenas 19 jogos garantidos e 60% são eliminados em agosto; na Série D atual (mesmo com 96 clubes em 2026), são apenas 10 jogos mínimos na 1ª fase, eliminando 33% dos clubes em julho. Mais de 180 agremiações profissionais encerram suas atividades desportivas precocemente, resultando em descontinuidade de vínculos de trabalho e insolvência econômica.
2. **Ineficiência Logística Subsidiada:** Os custos logísticos das Séries C e D são **100% custeados pela CBF**, pois os clubes dessas divisões não possuem receitas televisivas para bancar passagens aéreas e hotelaria corporativa. No formato radial atual sem turnês encadeadas, a CBF subsidia voos comerciais de última hora com conexões circulares e pernoites intermediários desnecessários.

### O Modelo Proposto
O projeto formula e resolve um modelo matemático rigoroso que viabiliza **244 agremiações em atividade simultânea regular sob subsídio CBF**:
* **Série A (20 clubes):** Turno e returno de âmbito nacional (38 rodadas, 380 partidas).
* **Série B (20 clubes):** Turno e returno de âmbito nacional (38 rodadas, 380 partidas).
* **Série C (60 clubes):** 4 Conferências Regionais (Sul-MS: 14 clubes, Sudeste: 16, Nordeste: 16, Norte-Centro: 14) com 26 a 30 rodadas regulares.
* **Série D (144 clubes):** 18 Ligas Regionais em 4 Macrorregiões (Sul-MS: 32 clubes em 4 ligas; Sudeste: 36 em 4 ligas; Nordeste: 36 em 4 ligas; Norte-Centro: 40 em 6 ligas) com 10 a 22 partidas.

**Resultado Consolidado (Séries C e D):** Expansão de **+160% no volume de partidas oficiais** (de 758 para 1.959 jogos) e ampliação de 116 para **204 clubes com calendário de abril a novembro**, mantendo o equilíbrio orçamentário da CBF e reduzindo em **-56,3% o custo logístico médio por partida**.

---

## 3. Módulos da Aplicação Web

A plataforma organiza a investigação e os resultados em três módulos principais:

### A. Estudo de Caso Comparativo (`/estudo-de-caso`)
* **Placar Macro Executivo:** Comparação direta dos parâmetros orçamentários, distâncias percorridas, noites de hotelaria e emissões de carbono ($CO_2$) entre o Status Quo CBF 2026 e o Modelo Proposto (Temporada 1).
* **Explorador Interativo de Grupos & Tabelas Oficiais (CBF 2026 vs. Proposto):**
  * **Série D:** Inspeção dos 16 grupos oficiais da CBF (A1 a A16, 6 clubes cada) via seletor com slider e botões de passo, alternável com a visualização das 18 Ligas Regionais Propostas.
  * **Série C:** Tabela detalhada do grupo único continental oficial da CBF (20 clubes, 19 rodadas) comparada às 4 Conferências Regionais Propostas.
* **Duelo das Divisões & Regulamento Oficial 2026:** Especificação canônica dos formatos da Série C (19 rodadas iniciais + quadrangulares de acesso) e Série D (96 clubes em 16 grupos + mata-mata em 5 fases).
* **Matriz de Prós & Contras e Trade-offs:** Análise crítica dos benefícios e das concessões operacionais necessárias (turnês encadeadas com múltiplos jogos fora de casa).
* **Análise Micro por Clube & Laboratório de Rotas:** Detalhamento individual de rota para clubes de todas as regiões (Trem-AP, Ji-Paraná-RO, América-RN, Maricá-RJ, Barra-SC, Manauara-AM, etc.), com turnês encadeadas ($TTP-2$ a $TTP-6$), conexões terrestres e aéreo.
* **Mapa Interativo com Leaflet:** Visualização geográfica vetorial das rotas e itinerários de cada clube analisado.

### B. Especificação Canônica & Metodologia (`/metodologia`)
Apresentada rigorosamente em 8 seções sequenciais seguindo padrões de excelência científica:
1. **O Problema & Vazio de Calendário:** Diagnóstico da descontinuidade desportiva nacional (apenas 19 jogos mínimos na C e 10 jogos na D atual) e o objetivo fundamental de manter 244 agremiações com calendário estável sob subsídio sustentável da CBF.
2. **Engenharia de Dados & Redes Reais:** Coleta auditada de 6 temporadas (2019–2024 via Ogol e `BrazilianFootball/Data`), rede aeroviária comercial real ANAC VRA ($\ge 52$ voos anuais no GeoFlight-BR) e matriz viária rodoviária OSRM ($< 1.000$ km com fator de tortuosidade 1,30).
3. **Prestígio Esportivo & PageRank:** Grafo direcionado ponderado $G = (V, E)$ com 876 agremiações catalogadas, fluxo do perdedor para o vencedor, ponderação por torneios de $w=1$ a $w=20$, amortecimento $\alpha = 0{,}85$, decaimento temporal e o conceito de PageRank Residual Estadual.
4. **Arquitetura da Pirâmide dos 244 Clubes:** Estruturação em 4 divisões (A: 20, B: 20, C: 60, D: 144), cotas regionais da Série D (Sul-MS: 32, Sudeste: 36, Nordeste: 36, Norte-Centro: 40), Teto Antitruste do Sudeste (36 vagas), Princípio do Elevador Fechado ($\Delta K_r = 0$) e Equação de Invariância Federativa.
5. **Zoneamento Espacial (Séries C e D):** Causalidade hierárquica — Série C resolvida primeiro em 4 Conferências Regionais contíguas; Série D com 6 Corredores Canônicos Blindados no Norte-Centro (restrições fluviais amazônicas) e 12 Ligas otimizadas via CP-SAT *Bounded-Radius Medoids*.
6. **Escalonamento Otimizado (TTP-k via CP-SAT):** Otimização do *Traveling Tournament Problem*, modelo *Unmirrored 2DRR*, restrição *No-Repeat* $|r_1 - r_2| \ge 2$, limites TTP-4 (Sudeste), TTP-5 (Sul e Nordeste) e TTP-6 (Norte-Centro), com *Warm-Start* Berger Poligonal ($< 0{,}01$s) e busca local LNS (*Sliding Window Exchange*), economizando R$ 31,14M anualmente.
7. **Engenharia Multimodal, Custos & Monte Carlo:** Teto fisiológico de 15h, limiares de ônibus mandatório ($\le 500$ km na Série C e $\le 700$ km na Série D), equações canônicas de custo auditadas da CBF (bate-volta, rodoviário pleno e aéreo comercial) e validação estocástica com 10.000 iterações de Monte Carlo.
8. **Laboratório Interativo de Dados & Reprodutibilidade:** Tabela analítica interativa com 876 clubes e 27 Federações Estaduais, filtros reativos por divisão e estado, ordenação dinâmica por PageRank e pipelines abertos.

### C. Simulador Quinquenal & Visualizador Cartográfico (`/` e `/dashboard`)
* **Simulação Sequencial de 5 Temporadas:** Execução interativa ano a ano com cálculo de classificações, play-ins, decisões regionais e transições entre divisões (princípio do elevador fechado entre Séries C e D).
* **Re-Clusterização Geográfica Automática:** Ajuste dinâmico de conferências da Série C e ligas da Série D a cada biênio/quinquênio via Diagramas de Voronoi e Algoritmo Húngaro de designação ótima.
* **Player Rodada a Rodada:** Painel de execução das rodadas com rastreamento logístico em tempo real (veículo, distância, custo e conexão de turnê TTP).
* **Balanço Executivo do Quinquênio:** Consolidação final dos 5 anos demonstrando a estabilidade territorial, a sustentabilidade financeira e o equilíbrio esportivo.

---

## 4. Estrutura de Arquivos e Dados Estáticos

O simulador opera inteiramente em arquitetura estática no cliente (Client-Side SPA), garantindo alta velocidade e ausência de dependência de APIs externas:

```
Simulacao-Futebol-Brasileiro/
├── static/
│   ├── json/
│   │   ├── teams_db.json                 # 876 agremiações catalogadas com coordenadas e métricas
│   │   ├── pagerank_analytics.json       # Analytics de PageRank individual, estadual e macrorregional
│   │   ├── case_study_baseline.json      # Insumos do estudo de caso comparativo macro, micro e tabelas
│   │   ├── cbf_official_formats_2026.json# Base de regras, fases e regulamentos oficiais CBF 2026
│   │   ├── comparison_cbf_serie_C.json   # Base comparativa clube a clube para a Série C
│   │   ├── comparison_cbf_serie_D.json   # Base comparativa clube a clube para a Série D
│   │   └── seasons/
│   │       ├── season_1.json             # Rodadas, jogos, custos e classificações da Temporada 1
│   │       ├── season_2.json             # Dados da Temporada 2
│   │       ├── season_3.json             # Dados da Temporada 3
│   │       ├── season_4.json             # Dados da Temporada 4
│   │       └── season_5.json             # Dados da Temporada 5
│   └── plots/
│       ├── mapa_estatico_isoligas.png    # Cartograma vetorial oficial das ligas e conferências
│       └── pyramid_tabular_flowchart.png # Diagrama de fluxo e hierarquia da pirâmide de 244 clubes
├── src/
│   ├── routes/
│   │   ├── +page.svelte                  # Página Inicial (Apresentação, Pirâmide e Pilares)
│   │   ├── estudo-de-caso/
│   │   │   └── +page.svelte              # Módulo do Estudo de Caso Comparativo (Sliders & Tabelas)
│   │   ├── metodologia/
│   │   │   └── +page.svelte              # Módulo da Metodologia Científica em 8 Seções KaTeX
│   │   └── dashboard/
│   │       └── +page.svelte              # Módulo do Simulador Quinquenal
│   ├── lib/
│   │   ├── components/                   # Componentes modulares Svelte (Map, Navbar, Modais, etc.)
│   │   ├── stores/                       # Gerenciamento de estado reativo (gameStore.js)
│   │   └── utils/                        # Utilitários de cálculo geográfico e nomenclatura
│   └── app.html
├── package.json
└── README.md
```

---

## 5. Pilares Matemáticos e Parametrização Logística

### Parâmetros Logísticos CBF Auditados
* **Delegação Padrão:** 32 pessoas por clube visitante (atletas, comissão técnica, médica e dirigentes).
* **Diária de Hospedagem e Alimentação:** R$ 350,00 por pessoa/dia (R$ 11.200,00/dia para a delegação de 32 pessoas).
* **Viagem Bate-Volta Curta ($D_{\text{rod}} \le 200\text{ km}$):** $C = (D_{\text{rod}} \times 40{,}00) + 4.800{,}00$ (ônibus local e refeições, sem pernoite de hotel).
* **Viagem Terrestre Plena ($D_{\text{rod}} > 200\text{ km}$):** $C = (D_{\text{rod}} \times 40{,}00) + 25.000{,}00$ (ônibus leito fretado + 2 diárias de hotel corporativo para 32 pessoas).
* **Viagem Aérea Comercial:** $C = 40.000{,}00 + (D_{\text{rod}} \times 45{,}00) + 35.000{,}00$ (passagens aéreas para 32 pessoas com bagagem pesada de uniformes/equipamentos + traslados de conexão + diárias).
* **Deslocamento Urbano / Metropolitano:** Para distâncias $\le 45\text{ km}$, o jogo é classificado como trajeto metropolitano.
* **Fadiga Fisiológica Limite:** Máximo de 15 horas contínuas de deslocamento rodoviário (limiar de corte de modal: 500 km na Série C e 700 km na Série D).

---

## 6. Instalação e Execução Local

### Pré-requisitos
* **Node.js:** Versão 18 ou superior.
* **npm:** Gerenciador de pacotes do Node.

### Instruções

```bash
# 1. Clonar o repositório
git clone https://github.com/jgabrielsg/Simulacao-Futebol-Brasileiro.git

# 2. Acessar a pasta do projeto
cd Simulacao-Futebol-Brasileiro

# 3. Instalar as dependências
npm install

# 4. Iniciar o servidor de desenvolvimento
npm run dev

# 5. Gerar o build estático de produção
npm run build

# 6. Visualizar a versão compilada de produção
npm run preview
```

Acesse em seu navegador: `http://localhost:5173`.

---

## 7. Licença

Este projeto é disponibilizado sob a licença **MIT**, permitindo o uso acadêmico, educacional e desportivo com a devida citação do autor e do trabalho.
