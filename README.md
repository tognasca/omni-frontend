# OmniAI — Dashboard Frontend

Interface web do OmniAI WhatsApp Manager. React 18 + Vite + TailwindCSS.  
Responsivo para **web**, **desktop (PWA)** e **smartphone**.

## Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 + TypeScript | UI |
| Vite 5 | Build e dev server |
| TailwindCSS 3 | Estilo |
| TanStack Query | Cache e fetching de dados |
| Zustand | Estado global |
| React Router 6 | Roteamento SPA |
| Recharts | Gráficos |
| SignalR Client | Tempo real (handoffs, novas mensagens) |
| Lucide React | Ícones |
| Axios | HTTP client |

## Rodar em desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# Edite VITE_TENANT_ID com o ID do tenant criado pelo seed

# 3. Iniciar (a API precisa estar rodando em localhost:90)
npm run dev
# Abre em: http://localhost:3000
```

O Vite faz proxy automático de `/api` e `/hubs` para `https://chatboxapi.ademartognasca.com.br`.

## Build para produção

```bash
npm run build
# Output: dist/
```

## Docker (junto com a API)

Coloque a pasta `omni-frontend` dentro da raiz do projeto `OmniAI`  
(mesmo nível do `docker-compose.yml`) e rode:

```bash
# Na raiz do projeto OmniAI
docker-compose -f omni-frontend/docker-compose-fullstack.yml up --build -d

# Acessos:
# Dashboard: http://localhost:3000
# API/Swagger: https://chatboxapi.ademartognasca.com.br
```

## Instalar como PWA (smartphone)

**Android (Chrome):**
1. Abra `http://SEU_IP:3000` no Chrome
2. Menu ⋮ → "Adicionar à tela inicial"

**iOS (Safari):**
1. Abra `http://SEU_IP:3000` no Safari
2. Botão compartilhar → "Adicionar à Tela de Início"

**Desktop (Chrome/Edge):**
1. Ícone de instalação na barra de endereço
2. Ou Menu → "Instalar OmniAI"

## Páginas disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com métricas e gráficos |
| `/conversations` | Chat em tempo real + gerenciamento |
| `/numbers` | Números WhatsApp conectados |
| `/knowledge` | Base de conhecimento da IA (RAG) |
| `/triggers` | Gatilhos de transferência humana |
| `/settings` | Prompt, modelo e horário da IA |
| `/metrics` | Métricas detalhadas |

## Estrutura

```
src/
├── components/
│   └── layout/       # Sidebar, TopBar, alertas
├── hooks/
│   └── useSignalR.ts # Conexão tempo real
├── pages/            # Uma página por rota
├── services/
│   └── api.ts        # Todos os calls REST + types
├── store/
│   └── useStore.ts   # Estado global (Zustand)
├── App.tsx           # Router + QueryClient
├── main.tsx          # Entry point
└── index.css         # Tailwind + tokens CSS
```
