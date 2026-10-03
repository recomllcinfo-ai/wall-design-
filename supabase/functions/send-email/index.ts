import { Webhook } from "npm:standardwebhooks@1.0.0";

const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace("v1,whsec_", "");

type EmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
};

const subjects: Record<string, string> = {
  signup: "Confirm your Apex Offshore account",
  invite: "You've been invited to Apex Offshore",
  magiclink: "Your Apex Offshore sign-in link",
  recovery: "Reset your Apex Offshore password",
  email_change: "Confirm your new Apex Offshore email",
  reauthentication: "Your Apex Offshore verification code",
};

function emailHtml(action: string, href: string, email: string, token: string) {
  const heading =
    action === "recovery" ? "Reset your password" :
    action === "magiclink" ? "Sign in" :
    action === "email_change" ? "Confirm your new email" :
    action === "reauthentication" ? "Verification code" :
    "Confirm your email";
  const body =
    action === "reauthentication"
      ? `Use this code to continue: <strong style="color:#ffffff;">${token}</strong>`
      : `Use the button below for <span style="color:#ffffff;">${email}</span>. This link expires soon and can only be used once.`;
  const button = action === "reauthentication" ? "" : `
            <tr>
              <td align="center" style="padding:28px 36px 8px;">
                <a href="${href}" style="display:inline-block;padding:14px 28px;background:#4f46e5;color:#ffffff;text-decoration:none;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;font-weight:650;border-radius:12px;">${heading}</a>
              </td>
            </tr>`;
  return `<div style="margin:0;padding:32px 16px;background:#070b14;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:20px;">
      <tr>
        <td style="padding:36px 36px 8px;text-align:center;">
          <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:14px;background:#4f46e5;color:#ffffff;font-size:24px;font-weight:700;">A</div>
          <p style="margin:18px 0 0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#a5b4fc;">Apex Offshore</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 36px 0;">
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#ffffff;">${heading}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#cbd5e1;">${body}</p>
        </td>
      </tr>
      ${button}
      <tr>
        <td style="padding:28px 36px 32px;">
          <p style="margin:0;padding-top:18px;border-top:1px solid #1f2937;font-size:12px;line-height:1.6;color:#64748b;">If you did not request this, you can ignore this email.<br>Apex Offshore · apexoffshore.online</p>
        </td>
      </tr>
    </table>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 });
  }
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  try {
    const wh = new Webhook(hookSecret);
    const verified = wh.verify(payload, headers) as { user: { email: string }; email_data: EmailData };
    const { user, email_data } = verified;
    const action = email_data.email_action_type;
    const redirect = encodeURIComponent(email_data.redirect_to || "https://apexoffshore.online");
    const href = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${email_data.token_hash}&type=${action}&redirect_to=${redirect}`;
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Apex Offshore <noreply@apexoffshore.online>",
        to: [user.email],
        subject: subjects[action] ?? "Apex Offshore",
        html: emailHtml(action, href, user.email, email_data.token),
      }),
    });
    if (!sent.ok) {
      const detail = await sent.text();
      return new Response(JSON.stringify({ error: { message: detail } }), { status: 500 });
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "hook failed";
    return new Response(JSON.stringify({ error: { message } }), { status: 401 });
  }
});
