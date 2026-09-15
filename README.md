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

1. **Vácuo de Calendário Anual:** O calendário nacional integral é assegurado apenas para 60 agremiações (Séries A, B e C). Mais de 180 agremiações profissionais encerram suas atividades desportivas precocemente em abril, logo após o término dos campeonatos estaduais, resultando em demissões em massa de atletas e comissões técnicas, desvalorização de patrimônio físico e insolvência econômica.
2. **Ineficiência Logística Subsidiada:** Os custos logísticos das Séries C e D são **100% bancados pela CBF**, uma vez que os clubes dessas divisões não dispõem de receita operacional para cobrir despesas de transporte e hospedagem. No formato atual da Série C (turno único nacional de 20 clubes) e da Série D (grupos sem turnês encadeadas), o modelo gera trajetos cruzados de longa distância, com dependência excessiva de voos comerciais de última hora e pernoites intermediários desnecessários.

### O Modelo Proposto
O projeto formula e resolve um modelo matemático rigoroso que viabiliza **244 agremiações em atividade simultânea regular sob subsídio CBF**:
* **Série A (20 clubes):** Turno e returno simétrico de âmbito nacional (38 rodadas, 380 partidas).
* **Série B (20 clubes):** Turno e returno simétrico de âmbito nacional (38 rodadas, 380 partidas).
* **Série C (60 clubes):** 4 Conferências Regionais (Sul-MS com 14 clubes, Sudeste com 16, Nordeste com 16, Norte-Centro com 14).
* **Série D (144 clubes):** 18 Ligas Regionais em 4 Macrorregiões (Sul-MS: 32 clubes em 4 ligas; Sudeste: 36 em 4 ou 5 ligas; Nordeste: 36 em 4 ou 5 ligas; Norte-Centro: 40 em 5 ligas).

**Resultado Consolidado (Séries C e D):** Expansão de **+160% no volume de partidas oficiais** (de 758 para 1.972 jogos) e ampliação de 116 para **204 clubes com calendário de abril a novembro**, com aumento de apenas **+13,66% no orçamento global CBF** (de R$ 79,62M para R$ 90,50M) e redução de **-56,3% no custo logístico médio por partida** (de R$ 105.036 para R$ 45.890).

---

## 3. Módulos da Aplicação Web

A plataforma organiza a investigação e os resultados em três módulos principais:

### A. Estudo de Caso Comparativo (`/estudo-de-caso`)
* **Placar Macro Executivo:** Comparação direta dos parâmetros orçamentários, distâncias percorridas, noites de hotelaria e emissões de carbono ($CO_2$) entre o Status Quo CBF 2026 e o Modelo Proposto (Temporada 1).
* **Duelo das Divisões:** Visão comparativa das regras estruturais e operacionais das Séries C e D atuais frente às divisões propostas.
* **Matriz de Prós & Contras e Trade-offs:** Análise crítica honesta dos benefícios (sustentabilidade, empregabilidade, menor pegada ecológica) e das concessões necessárias (turnês com múltiplos jogos consecutivos fora de casa no Norte-Centro, aumento de R$ 10,88M no investimento global).
* **Análise Micro por Clube & Laboratório de Rotas:** Detalhamento individual de rota para clubes emblemáticos de todas as regiões (Trem-AP, Ji-Paraná-RO, América-RN, Maricá-RJ, Barra-SC, Manauara-AM, entre outros), exibindo as turnês encadeadas ($TTP-2$ a $TTP-6$), conexões terrestres, trechos aéreos e deslocamentos urbanos/locais.
* **Mapa Interativo com Leaflet:** Visualização geográfica vetorial das rotas e itinerários de turnê de cada clube analisado.

### B. Especificação Canônica & Metodologia (`/metodologia`)
* **Fundamentação Matemática em KaTeX:** Formulação completa das equações de Teoria dos Grafos e Pesquisa Operacional diretamente na tela.
* **Modelagem do PageRank Esportivo:** Grafo direcionado ponderado $G = (V, E)$ com 876 clubes catalogados, fluxo de prestígio do perdedor para o vencedor ($w \in [1, 20]$), decaimento temporal ($\lambda = 0.20$) e amortecimento $d = 0.85$.
* **State PageRank & Residual Federativo:** Invariância de conservação de 100% do prestígio distribuído, garantindo o atendimento estrito ao critério federativo de no mínimo 2 agremiações por UF na Série D.
* **Engenharia de Dados Multimodal:** Pipeline estruturado com raspagem de partidas históricas (Selenium/Ogol), batimento cadastral (Wikidata), distâncias rodoviárias reais via Open Source Routing Machine (OSRM) e malha aeroviária comercial real baseada no Registro de Voos da ANAC (VRA) e dados GeoFlight-BR.
* **Pesquisa Operacional (CP-SAT & TTP-k):** Otimização do *Traveling Tournament Problem* com janelas de turnê, distritamento *Bounded-Radius* e restrições fisiológicas (limite de 15 horas de estrada, 500/700 km de raio de ônibus e *Smart Ground Override*).
* **Analytics Interativo de PageRank:** Tabela com busca, paginação e ordenação dos 876 clubes cadastrados e matriz analítica das 27 Unidades Federativas.

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
│   └── json/
│       ├── teams_db.json                 # 876 agremiações catalogadas com coordenadas e métricas
│       ├── pagerank_analytics.json       # Analytics de PageRank individual, estadual e macrorregional
│       ├── case_study_baseline.json      # Insumos do estudo de caso comparativo macro e micro
│       ├── comparison_cbf_serie_C.json   # Base comparativa clube a clube para a Série C
│       ├── comparison_cbf_serie_D.json   # Base comparativa clube a clube para a Série D
│       └── seasons/
│           ├── season_1.json             # Rodadas, jogos, custos e classificações da Temporada 1
│           ├── season_2.json             # Dados da Temporada 2
│           ├── season_3.json             # Dados da Temporada 3
│           ├── season_4.json             # Dados da Temporada 4
│           └── season_5.json             # Dados da Temporada 5
├── src/
│   ├── routes/
│   │   ├── +page.svelte                  # Página Inicial (Apresentação, Pirâmide e Pilares)
│   │   ├── estudo-de-caso/
│   │   │   └── +page.svelte              # Módulo do Estudo de Caso Comparativo
│   │   ├── metodologia/
│   │   │   └── +page.svelte              # Módulo da Metodologia e Especificação Canônica
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

### Parâmetros Logísticos CBF Adotados
* **Delegação Padrão:** 32 pessoas por clube visitante (atletas, comissão técnica, médica e dirigentes).
* **Diária de Hospedagem e Alimentação:** R$ 350,00 por pessoa/dia (R$ 11.200,00/dia para a delegação).
* **Transporte Terrestre Fretado (Ônibus Leito):** R$ 15,50 por km rodado real (calculado via OSRM).
* **Transporte Aéreo Regular Comercial:** R$ 850,00 por trecho/pessoa (R$ 27.200,00 por trecho para a delegação de 32 pessoas).
* **Deslocamento Urbano / Metropolitano:** Para distâncias $\le 45\text{ km}$, o jogo é classificado como trajeto local (sem custos de diária ou pernoite).
* **Fadiga Fisiológica Limite:** Máximo de 15 horas contínuas de deslocamento rodoviário.

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
