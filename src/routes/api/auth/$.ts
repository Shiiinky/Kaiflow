import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function handle(request: Request) {
  try {
    return await auth.handler(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'authentification";
    console.error("[auth]", err);
    return Response.json(
      {
        message:
          /pglite|wasm|database|connect|econnrefused|password/i.test(message)
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
