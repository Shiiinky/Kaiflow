# Kaiflow

**Modélisez vos flux. Pilotez votre performance.**

Outil no-code pour responsables de production : cartographie VSM, takt time, TRS, goulot, Yamazumi, MOS et séquençage de Johnson.

Live : [kaiflow.fr](https://kaiflow.fr/)

## Démarrer

```bash
npm install
npm run dev
```

Ouvre l’éditeur sur le port 8080. Les flux sont stockés dans le navigateur (localStorage). Aucun compte requis.

```bash
npm run build      # production (Nitro / Vercel)
npm run typecheck
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing |
| `/app` | Atelier (liste des flux) |
| `/editor/$id` | Canvas drag & drop, KPIs, MOS, Johnson |
| `/rapport/$id` | Rapport imprimable / PDF |

Anciennes URLs (`/dashboard`, `/editor`, `/login`) redirigent vers `/app`.

## Fonctionnalités

- Éditeur visuel (postes, stocks, contrôles, transports)
- Takt net, temps utile TRS (dispo × rebuts × machines)
- Postes parallèles fusionnés, goulot, lead time (chemin critique)
- Yamazumi + ETP, VA / NVA
- MOS : chrono terrain, Gantt, activités non cyclées
- Séquençage de Johnson (n jobs, 2 machines)
- Recommandations + simulation « +1 machine »
- Import / export JSON

## Stack

React 19 · TanStack Start · Tailwind v4 · Zustand · Vite · Nitro (preset Vercel)

## Déploiement

Le build génère la sortie Vercel (`.vercel/output`). Sur Vercel :

- Framework : Other
- Build command : `npm run build`
- Node 22+
- Variable : `VITE_AUTH_ENABLED=false` (déjà dans `.env`)

## Licence

Usage privé / produit Kaiflow — © 2026
