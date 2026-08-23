import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/mentions-legales")({
  component: Mentions,
});

function Mentions() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
      </header>
      <article className="prose prose-invert mx-auto max-w-2xl px-4 py-12 text-sm text-muted-2">
        <h1 className="font-display text-3xl font-extrabold text-fg">Mentions légales</h1>
        <p className="mt-4">Éditeur : Kaiflow (projet en bêta privée).</p>
        <p>
          Contact :{" "}
          <a className="text-accent" href="mailto:contact@kaiflow.fr">
            contact@kaiflow.fr
          </a>
        </p>
        <p>
          Hébergement : Vercel Inc. — données applicatives stockées via PostgreSQL (Neon).
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
