import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function handle(request: Request) {
  try {
    const res = await auth.handler(request);
    if (res.status < 500) return res;
    const text = await res.clone().text();
    if (text) return res;
    return Response.json(
      {
        message:
          "Le serveur d'auth n'a pas de base Postgres (DATABASE_URL). Sur Vercel, créez une base Neon et redéployez.",
        code: "AUTH_ERROR",
      },
      { status: 500, headers: { "content-type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'authentification";
    console.error("[auth]", err);
    return Response.json(
      {
        message:
          /pglite|wasm|database|connect|econnrefused/i.test(message)
            ? "Base de données absente sur ce déploiement. Ajoutez DATABASE_URL (Neon) sur Vercel."
            : message,
        code: "AUTH_ERROR",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
