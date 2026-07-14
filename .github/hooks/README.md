# Project Hooks for Gotlandsguiden

Detta dokument forklarar hur hooks i `.github/hooks` hjalper AI-tjanster och utvecklare att halla projektet stabilt.

## Syfte

Hooks ska minska regressionsrisk i tre kritiska ytor:

1. Datakvalitet i `public/js/places-data.js`
2. State/render-disciplin i `public/js/app.js`
3. Frontendkvalitet i `public/index.html` och `public/css/style.css`

## Aktiva hookfiler

### `data-validation.json`

Validerar platsdata-schema, kategori-nycklar och koordinater.

Skyddar mot:

- Fel kategorinamn
- Saknade obligatoriska falt (`id`, `name`, `category`, `lat`, `lng`, `description`)
- Orimliga koordinater

### `code-quality.json`

Fokuserar pa kodhygien och konsekvens.

Skyddar mot:

- Oavsiktliga `console.log`
- Missad `render()` efter state-andring
- Oonskad stil-drift i CSS

### `performance-checks.json`

Hittar vanliga prestandafallor i frontendlogiken.

Skyddar mot:

- `render()` i loopar
- Tung synkron logik i UI-flode
- HTML-andringar som riskerar laddningsprestanda

### `accessibility-seo.json`

Validerar tillganglighet och semantik.

Skyddar mot:

- Saknade `aria-*` attribut
- Svag semantisk struktur
- Vanliga SEO-basmissar i HTML

### `category-consistency.json`

Verifierar att alla kategorier ar konsistenta mellan definition och anvandning.

Skyddar mot:

- Stavfel i kategori-nycklar
- Oanvanda kategori-definitioner

## Hur AI-tjanster ska anvanda hooks

1. Se hook-varningar som krav, inte bara forslag.
2. Om hook signalerar schemafel: justera dataforandringen direkt.
3. Om hook signalerar render/state-fel: los problemet innan fler features laggs till.
4. Om hook signalerar CSS/HTML-problem: bevara mobilforst och tillganglighet.

## Praktiska regler vid redigering

1. Vid andring i `public/js/places-data.js`: kontrollera kategorier och schema.
2. Vid andring i `public/js/app.js`: kontrollera att state-forandringar foljs av `render()`.
3. Vid andring i `public/css/style.css`: behall variabelbaserad design och mobilforst-beteende.
4. Vid andring i `public/index.html`: behall semantik och ARIA-kvalitet.

## Vanliga felbilder

### Kategori-stavfel

Exempel: `strnad` i stallet for `strand`.

Effekt: filter, markorer och listvy blir inkonsekventa.

### Render-regression

Exempel: state andras men `render()` gloms.

Effekt: UI verkar trasig trots korrekt state.

### Hardkodad design-drift

Exempel: ny hardkodad hexfarg i komponent.

Effekt: designen blir inkonsekvent mellan ljust/morkt lage.

## Nar du lagger till en ny hook

1. Hall kommandot snabbt (<2 sekunder normalt).
2. Skriv tydlig `description`.
3. Scopea `path` sa smalt som mojligt.
4. Testa med en medvetet felaktig andring for att verifiera signal.

## Relaterade dokument

- `AGENTS.md`
- `deploy/proxmox/README.md`
