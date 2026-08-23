import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/billing/org-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "accepting" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user) return;
    if (status !== "idle") return;

    setStatus("accepting");
    void acceptInvite({ data: token })
      .then((res) => {
        setOrgId(res.orgId);
        setStatus("ok");
        setMessage("Invitation acceptée. Bienvenue dans l'équipe !");
      })
      .catch((e: Error) => {
        setStatus("error");
        setMessage(e.message || "Impossible d'accepter l'invitation");
      });
  }, [isPending, user, token, status]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Invitation</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Rejoindre une équipe</h1>

        {isPending ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Vérification de la session…
          </p>
        ) : !user ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted">
              Connectez-vous (ou créez un compte) avec l'adresse email invitée pour accepter.
            </p>
            <Button asChild className="w-full">
              <Link to="/login" search={{ mode: "signin" }}>
                Se connecter
              </Link>
            </Button>
            <Button variant="secondary" asChild className="w-full">
              <Link to="/login" search={{ mode: "signup" }}>
                Créer un compte
              </Link>
            </Button>
            <p className="text-xs text-muted">
              Après connexion, revenez sur ce lien d'invitation.
            </p>
          </div>
        ) : status === "accepting" ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Acceptation en cours…
          </p>
        ) : status === "ok" ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>{message}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {orgId ? (
                <Button asChild className="flex-1">
                  <Link to="/entreprise/$orgId" params={{ orgId }}>
                    Voir l'équipe
                  </Link>
                </Button>
              ) : null}
              <Button variant="secondary" asChild className="flex-1">
                <Link to="/app">Mes flux</Link>
              </Button>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {message}
            </div>
            <Button variant="secondary" asChild>
              <Link to="/app">Retour à l'atelier</Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
