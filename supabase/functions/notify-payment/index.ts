const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const networks: Record<string, string> = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  bnb: "BNB Chain",
  base: "Base",
  arbitrum: "Arbitrum One",
  polygon: "Polygon",
  solana: "Solana",
  optimism: "OP Mainnet",
  avalanche: "Avalanche C-Chain",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatAmount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function paymentHtml(opts: {
  amount: string;
  symbol: string;
  network: string;
  accountName: string;
  fromAddress: string;
  toAddress: string;
  memo: string | null;
}) {
  const memo = opts.memo
    ? `<p style="margin:16px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">Note<br><strong style="color:#0f172a;">${escapeHtml(opts.memo)}</strong></p>`
    : "";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f6f8;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.amount)} ${escapeHtml(opts.symbol)} was sent to your Apex Offshore account.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;">
            <tr><td style="height:4px;background:#0f2744;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:36px 40px 40px;font-family:Georgia,'Times New Roman',serif;color:#0f172a;">
                <p style="margin:0 0 28px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#0f2744;">Apex Offshore</p>
                <p style="margin:0 0 8px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Payment received</p>
                <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:500;">A payment was sent to your account</h1>
                <p style="margin:18px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(opts.amount)} ${escapeHtml(opts.symbol)} was sent to <strong style="color:#0f172a;">${escapeHtml(opts.accountName)}</strong> on ${escapeHtml(opts.network)}.</p>
                <p style="margin:16px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">From<br><strong style="color:#0f172a;word-break:break-all;">${escapeHtml(opts.fromAddress)}</strong></p>
                <p style="margin:16px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">To<br><strong style="color:#0f172a;word-break:break-all;">${escapeHtml(opts.toAddress)}</strong></p>
                ${memo}
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:28px 0 8px;"><a href="https://apexoffshore.online" style="display:inline-block;background:#0f2744;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;line-height:1;padding:14px 22px;border-radius:4px;">Open Apex Offshore</a></td></tr>
                </table>
                <p style="margin:22px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#64748b;">This is a demo ledger notice, not a blockchain confirmation. If you were not expecting this payment, sign in and review the account activity.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px 22px;border-top:1px solid #e5e7eb;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">
                Apex Offshore<br>apexoffshore.online<br>This is a service message about your account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !resendKey || !supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: "unauthorized" }, 401);
  }

  const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: anonKey },
  });
  if (!callerRes.ok) return json({ error: "unauthorized" }, 401);
  const caller = await callerRes.json() as { id?: string };
  if (!caller.id) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null) as { hash?: unknown } | null;
  const hash = typeof body?.hash === "string" ? body.hash.trim() : "";
  if (!/^0x[a-f0-9]{64}$/i.test(hash)) return json({ error: "invalid hash" }, 400);

  const adminHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };
  const txRes = await fetch(
    `${supabaseUrl}/rest/v1/transactions?hash=eq.${encodeURIComponent(hash)}&type=eq.send&select=to_address,amount,token_symbol,network_id,memo,from_address,wallet_accounts!inner(user_id)&wallet_accounts.user_id=eq.${caller.id}&limit=1`,
    { headers: adminHeaders },
  );
  if (!txRes.ok) return json({ error: "lookup failed" }, 500);
  const rows = await txRes.json() as Array<{
    to_address: string;
    amount: string | number;
    token_symbol: string;
    network_id: string;
    memo: string | null;
    from_address: string;
  }>;
  const tx = rows[0];
  if (!tx) return json({ error: "transfer not found" }, 404);

  const dest = encodeURIComponent(tx.to_address);
  const acctRes = await fetch(
    `${supabaseUrl}/rest/v1/wallet_accounts?or=(address.ilike.${dest},solana_address.eq.${dest},bitcoin_address.eq.${dest})&select=name,user_id&limit=1`,
    { headers: adminHeaders },
  );
  if (!acctRes.ok) return json({ error: "lookup failed" }, 500);
  const accounts = await acctRes.json() as Array<{ name: string; user_id: string }>;
  const recipient = accounts[0];
  if (!recipient) return json({ sent: false, reason: "external" });

  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${recipient.user_id}`, {
    headers: adminHeaders,
  });
  if (!userRes.ok) return json({ error: "recipient lookup failed" }, 500);
  const recipientUser = await userRes.json() as { email?: string };
  if (!recipientUser.email) return json({ sent: false, reason: "no email" });

  const amount = formatAmount(tx.amount);
  const symbol = tx.token_symbol;
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Apex Offshore <noreply@apexoffshore.online>",
      to: [recipientUser.email],
      subject: `Payment received: ${amount} ${symbol}`,
      html: paymentHtml({
        amount,
        symbol,
        network: networks[tx.network_id] ?? tx.network_id,
        accountName: recipient.name,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        memo: tx.memo,
      }),
    }),
  });
  if (!sent.ok) {
    return json({ error: "email failed" }, 502);
  }
  return json({ sent: true, sameUser: recipient.user_id === caller.id });
});
