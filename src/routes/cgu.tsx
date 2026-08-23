import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/cgu")({
  component: CGU,
});

function CGU() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted-2">
        <h1 className="font-display text-3xl font-extrabold text-fg">Conditions d&apos;utilisation</h1>
        <p className="mt-4">
          Kaiflow est proposé en <strong className="text-fg">bêta privée</strong>. Le service peut
          évoluer, être interrompu ou présenter des bugs. Ne basez pas de décisions critiques
          uniquement sur les calculs sans validation métier.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Vous restez responsable des données saisies et de leur diffusion interne.</li>
          <li>Compte gratuit : quotas limités (flux / sièges) selon le plan affiché.</li>
          <li>Compte Pro / Entreprise : activé par l&apos;équipe Kaiflow pendant la bêta.</li>
          <li>Interdit : usage illégal, reverse engineering abusif, surcharge volontaire du service.</li>
        </ul>
        <p className="mt-6">
          <Link to="/" className="text-accent">
            ← Accueil
          </Link>
        </p>
      </article>
    </div>
  );
}
