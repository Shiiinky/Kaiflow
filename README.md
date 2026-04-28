# Kaiflow 🏭

**Modélisez vos flux. Pilotez votre performance.**

Kaiflow est un outil SaaS no-code destiné aux responsables de production industrielle. Il permet de modéliser visuellement les flux de production et d'obtenir automatiquement les indicateurs clés de performance.

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing page | `/` | Page d'accueil et présentation |
| Dashboard | `/dashboard` | Vue d'ensemble des flux |
| Éditeur | `/editor` | Éditeur de flux drag & drop |

## Fonctionnalités V1

- ✅ Éditeur de flux drag & drop (tactile + souris)
- ✅ Mode Opératoire Standard (MOS) par poste
- ✅ Calcul automatique : Takt Time, Lead Time, Rendement
- ✅ Détection des goulots d'étranglement
- ✅ Analyse VA / NVA (Valeur Ajoutée / Non Valeur Ajoutée)
- ✅ Taux de charge par poste
- ✅ Dashboard multi-flux

## Stack technique

- **Frontend** : HTML / CSS / JavaScript vanilla
- **Hébergement** : Vercel
- **Domaine** : kaiflow.fr

## Roadmap

- [ ] Authentification utilisateurs (Supabase Auth)
- [ ] Sauvegarde des flux en base de données
- [ ] Fiche KPIs exportable PDF
- [ ] Monétisation (Stripe)
- [ ] Algorithme de Johnson (séquençage 2 machines)
