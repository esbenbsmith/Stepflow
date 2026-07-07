# Stepflow

Dashboard visualizing average time between `dateOfFiling` and `dateOfDecision`
for rent board decisions, by municipality. Data comes from the
[huslejenaevn.dk GraphQL API](https://github.com/huslejenaevn-dk/GraphQL).

## How it works

The API caps pages at 50 items and has no server-side aggregation, so the
dashboard doesn't query it live. Instead:

1. `npm run sync` pages through all decisions with both dates set (~96k rows,
   ~1,900 requests) and upserts them into `data/stepflow.db` (SQLite).
2. The Next.js app reads from that local database and computes the averages
   per municipality — instant, no live API calls on page load.

Re-run `npm run sync` whenever you want fresh numbers. In production
(`docker-compose`), the container runs an initial sync on first boot, then
refreshes once a day automatically (see `docker/entrypoint.sh`).

## Local development

```bash
cp .env.local.example .env.local   # then fill in HUSLEJENAEVN_API_KEY
npm install
npm run sync   # first-time data pull, takes a few minutes
npm run dev
```

Open http://localhost:3000/sbst — the app is served under `/sbst` (see
`basePath` in `next.config.ts`) so it can live at `stepflow.fyi/sbst`.

## Deployment (Hetzner)

```bash
docker compose up -d --build
```

- Data persists in the `stepflow-data` volume across restarts/redeploys.
- If the server has no reverse proxy yet, uncomment the `caddy` service in
  `docker-compose.yml` — it gets a TLS cert for `stepflow.fyi` automatically.
- If another app already runs a reverse proxy on this server, skip the Caddy
  service and instead attach `stepflow` to that proxy's network and add a
  `stepflow.fyi` site block pointing at `stepflow:3000`. Point it (or its
  root) at `stepflow.fyi/sbst` since that's the only path the app serves.
