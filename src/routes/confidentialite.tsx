import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/confidentialite")({
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted-2">
        <h1 className="font-display text-3xl font-extrabold text-fg">Confidentialité</h1>
        <p className="mt-4">
          Kaiflow traite les données nécessaires au fonctionnement du service : compte (email, nom),
          organisations et flux que vous saisissez.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Finalité : fourniture de l&apos;application VSM / analyse de flux.</li>
          <li>Base : exécution du contrat / intérêt légitime (bêta).</li>
          <li>Conservation : pendant la durée du compte, puis suppression sur demande.</li>
          <li>Sous-traitants : Vercel (hébergement), Neon (base de données), prestataires d&apos;auth.</li>
          <li>
            Vos droits (accès, rectification, suppression) :{" "}
            <a className="text-accent" href="mailto:contact@kaiflow.fr">
              contact@kaiflow.fr
            </a>
          </li>
        </ul>
        <p className="mt-6 text-xs text-muted">
          Document simplifié pour la bêta privée — sera enrichi avant commercialisation.
        </p>
        <p className="mt-6">
          <Link to="/" className="text-accent">
            ← Accueil
          </Link>
        </p>
      </article>
    </div>
  );
}
