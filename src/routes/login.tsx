import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>) => ({
    mode: raw.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  component: Login,
});

function Login() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const goApp = () => navigate({ to: "/app" });

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (signup) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Compte",
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await authClient.signIn.email({ email, password, callbackURL: "/app" });
        if (res.error) throw new Error(res.error.message);
      }
      goApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="landing-shell grid min-h-dvh place-items-center px-4">
      <div className="landing-mesh" />
      <SignedIn>
        <Navigate to="/app" />
      </SignedIn>
      <div className="relative w-full max-w-sm rounded-md border border-border bg-card/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <BrandMark />
        <h1 className="mt-5 font-display text-2xl font-extrabold">
          {signup ? "Créer un compte" : "Connexion"}
        </h1>
        <p className="mt-1 text-sm text-muted-2">
          Vos flux sont liés à votre compte. L'abonnement entreprise arrive ensuite.
        </p>

        {!authEnabled ? (
          <p className="mt-6 text-sm text-muted">Connexion désactivée.</p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/app" })}
                >
                  Continuer avec {p.label}
                </Button>
              ))}
            </div>

            <p className="my-5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              ou par email
            </p>

            <form className="space-y-3" onSubmit={onEmail}>
              {signup ? (
                <Field
                  label="Nom / société"
                  value={name}
                  onChange={setName}
                  autoComplete="organization"
                />
              ) : null}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
              <Field
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={signup ? "new-password" : "current-password"}
                required
              />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "…" : signup ? "Créer le compte" : "Se connecter"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              {signup ? (
                <>
                  Déjà un compte ?{" "}
                  <Link to="/login" search={{ mode: "signin" }} className="text-accent hover:underline">
                    Connexion
                  </Link>
                </>
              ) : (
                <>
                  Pas encore de compte ?{" "}
                  <Link to="/login" search={{ mode: "signup" }} className="text-accent hover:underline">
                    Créer un compte
                  </Link>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-sm border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
      />
    </label>
  );
}
