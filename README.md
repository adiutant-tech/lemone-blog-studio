# Lemoné Blog Studio

Generator boxów produktowych i spisów treści dla artykułów blogowych Lemoné.

## Architektura

- **Frontend** — React + Vite, deployowany na GitHub Pages
- **API proxy** — Cloudflare Worker, przekazuje requesty do Anthropic API z ukrytym kluczem
- **Model** — Claude Sonnet 4 (poprzez proxy)

```
przeglądarka → GitHub Pages → Cloudflare Worker → Anthropic API
                              (klucz tutaj)
```

## Setup lokalny

```bash
# 1. Klonuj repo
git clone https://github.com/USERNAME/lemone-blog-studio.git
cd lemone-blog-studio

# 2. Skopiuj env i wpisz URL swojego Workera
cp .env.example .env
# edytuj .env, wpisz VITE_API_URL=https://lemone-api.XXX.workers.dev

# 3. Zainstaluj zależności
npm install

# 4. Odpal dev server
npm run dev
# otwiera localhost:5173
```

## Deploy na GitHub Pages

### Pierwszorazowo

1. Utwórz repo na GitHub (np. `lemone-blog-studio`)
2. W `vite.config.js` ustaw `base: '/lemone-blog-studio/'` (nazwa repo z ukośnikami)
3. W repo: **Settings → Pages → Source: GitHub Actions**
4. W repo: **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `VITE_API_URL`
   - Value: URL Twojego Cloudflare Workera (`https://lemone-api.XXX.workers.dev`)
5. Push na `main` → workflow zbuduje i opublikuje
6. Apka żyje na `https://USERNAME.github.io/lemone-blog-studio/`

### Kolejne deploye

Każde `git push origin main` automatycznie triggeruje rebuild i deploy (~2 minuty).

## Cloudflare Worker

Kod Workera jest w pliku `worker.js` w root tego repo (do skopiowania na cloudflare dashboard, nie deployowane stąd).

**Setup Workera:**
1. dash.cloudflare.com → Workers & Pages → Create Worker
2. Wklej `worker.js`
3. W kodzie zmień `ALLOWED_ORIGINS[0]` na `https://USERNAME.github.io`
4. Settings → Variables → dodaj **Secret** `ANTHROPIC_API_KEY` z kluczem Anthropic
5. Deploy

## Bezpieczeństwo

- Klucz API nigdy nie trafia do przeglądarki — siedzi w Cloudflare Workers Secrets
- Worker akceptuje requesty tylko z whitelisty originów (GitHub Pages + localhost)
- Rate limit: 60 requestów / minutę / IP
- Worker waliduje payload (model, max_tokens, messages) — nie przekazuje arbitralnych pól dalej

## Struktura

```
lemone-blog-studio/
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── .gitignore
├── worker.js                   # kod Cloudflare Workera (nie deployowany przez Vite)
├── src/
│   ├── main.jsx               # entry point React
│   └── App.jsx                # cała aplikacja (1238 linii)
└── .github/
    └── workflows/
        └── deploy.yml         # auto-deploy na GitHub Pages
```
