/**
 * Transactional email via Resend (HTTPS API, no SDK required).
 *
 * Env:
 *   RESEND_API_KEY  — required to actually send
 *   EMAIL_FROM      — optional, default "Kaiflow <onboarding@resend.dev>"
 *   APP_URL         — optional base for links (falls back to BETTER_AUTH_URL / https://kaiflow.fr)
 */

const env = (key: string): string | undefined => {
  const v = process.env[key]?.trim();
  return v || undefined;
};

export function appBaseUrl(): string {
  return (
    env("APP_URL") ||
    env("BETTER_AUTH_URL") ||
    env("BETTER_AUTH_BASE_URL") ||
    "https://kaiflow.fr"
  ).replace(/\/$/, "");
}

export function isEmailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY"));
}

type SendResult = { ok: true; id?: string } | { ok: false; error: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY non configurée" };
  }

  const from = env("EMAIL_FROM") || "Kaiflow <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      const msg = body.message || body.name || `HTTP ${res.status}`;
      console.error("[email] Resend error:", msg);
      return { ok: false, error: msg };
    }

    return { ok: true, id: body.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur réseau";
    console.error("[email] send failed:", msg);
    return { ok: false, error: msg };
  }
}

export async function sendOrgInviteEmail(opts: {
  to: string;
  orgName: string;
  inviterName?: string;
  role: string;
  token: string;
}): Promise<SendResult> {
  const link = `${appBaseUrl()}/invite/${opts.token}`;
  const who = opts.inviterName?.trim() || "Un collègue";
  const roleLabel = opts.role === "admin" ? "admin" : "membre";

  const subject = `Invitation Kaiflow — rejoindre ${opts.orgName}`;

  const text = [
    `${who} vous invite à rejoindre l'équipe « ${opts.orgName} » sur Kaiflow (rôle : ${roleLabel}).`,
    "",
    `Ouvrez ce lien pour accepter (valable 14 jours) :`,
    link,
    "",
    `Connectez-vous ou créez un compte avec l'adresse ${opts.to}.`,
    "",
    "— Kaiflow · Optimisez vos flux de valeur",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#0b0f14;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8eef5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#121820;border:1px solid #1e2a38;border-radius:12px;padding:28px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#3dd6c6;">Kaiflow</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#f4f7fb;">Invitation d'équipe</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#c5d0dc;">
            <strong style="color:#f4f7fb;">${escapeHtml(who)}</strong> vous invite à rejoindre
            <strong style="color:#f4f7fb;">${escapeHtml(opts.orgName)}</strong>
            en tant que <strong>${roleLabel}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#8b9aab;">
            Lien valable 14 jours. Utilisez l'adresse <strong style="color:#c5d0dc;">${escapeHtml(opts.to)}</strong>.
          </p>
          <a href="${escapeHtml(link)}"
             style="display:inline-block;background:#3dd6c6;color:#0b0f14;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:8px;">
            Accepter l'invitation
          </a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7a8a;word-break:break-all;">
            Ou copiez ce lien :<br/>
            <a href="${escapeHtml(link)}" style="color:#3dd6c6;">${escapeHtml(link)}</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#4a5868;">Kaiflow · Optimisez vos flux de valeur</p>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to: opts.to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}
