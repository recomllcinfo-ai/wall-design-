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
  kind: "sender" | "recipient";
  amount: string;
  symbol: string;
  network: string;
  accountName: string;
  fromAddress: string;
  toAddress: string;
  memo: string | null;
}) {
  const sent = opts.kind === "sender";
  const lead = sent
    ? `You sent ${escapeHtml(opts.amount)} ${escapeHtml(opts.symbol)} from <strong style="color:#0f172a;">${escapeHtml(opts.accountName)}</strong> on ${escapeHtml(opts.network)}.`
    : `${escapeHtml(opts.amount)} ${escapeHtml(opts.symbol)} was sent to <strong style="color:#0f172a;">${escapeHtml(opts.accountName)}</strong> on ${escapeHtml(opts.network)}.`;
  const memo = opts.memo
    ? `<p style="margin:16px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">Note<br><strong style="color:#0f172a;">${escapeHtml(opts.memo)}</strong></p>`
    : "";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f6f8;">
    <div style="display:none;max-height:0;overflow:hidden;">${sent ? "Your Apex Offshore payment was sent." : "A payment was sent to your Apex Offshore account."}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;">
            <tr><td style="height:4px;background:#0f2744;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:36px 40px 40px;font-family:Georgia,'Times New Roman',serif;color:#0f172a;">
                <p style="margin:0 0 28px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#0f2744;">Apex Offshore</p>
                <p style="margin:0 0 8px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${sent ? "Payment sent" : "Payment received"}</p>
                <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:500;">${sent ? "Your payment was sent" : "A payment was sent to your account"}</h1>
                <p style="margin:18px 0 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">${lead}</p>
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

  const token = auth.slice("Bearer ".length);
  let isService = token === serviceKey;
  if (!isService) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")));
      isService = payload.role === "service_role";
    } catch {
      isService = false;
    }
  }

  let callerId = "";
  if (!isService) {
    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: anonKey },
    });
    if (!callerRes.ok) return json({ error: "unauthorized" }, 401);
    const caller = await callerRes.json() as { id?: string };
    if (!caller.id) return json({ error: "unauthorized" }, 401);
    callerId = caller.id;
  }

  const body = await req.json().catch(() => null) as { hash?: unknown } | null;
  const hash = typeof body?.hash === "string" ? body.hash.trim() : "";
  if (!/^0x[a-f0-9]{64}$/i.test(hash)) return json({ error: "invalid hash" }, 400);

  const adminHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };
  const txRes = await fetch(
    `${supabaseUrl}/rest/v1/transactions?hash=eq.${encodeURIComponent(hash)}&type=eq.send&select=account_id,to_address,amount,token_symbol,network_id,memo,from_address&limit=1`,
    { headers: adminHeaders },
  );
  if (!txRes.ok) return json({ error: "lookup failed" }, 500);
  const rows = await txRes.json() as Array<{
    account_id: string;
    to_address: string;
    amount: string | number;
    token_symbol: string;
    network_id: string;
    memo: string | null;
    from_address: string;
  }>;
  const tx = rows[0];
  if (!tx) return json({ error: "transfer not found" }, 404);

  const ownerRes = await fetch(
    `${supabaseUrl}/rest/v1/wallet_accounts?id=eq.${tx.account_id}&select=name,user_id&limit=1`,
    { headers: adminHeaders },
  );
  if (!ownerRes.ok) return json({ error: "lookup failed" }, 500);
  const owner = ((await ownerRes.json()) as Array<{ name: string; user_id: string }>)[0];
  if (!owner) return json({ error: "transfer not found" }, 404);
  if (!isService && owner.user_id !== callerId) return json({ error: "forbidden" }, 403);

  const senderUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${owner.user_id}`, {
    headers: adminHeaders,
  });
  if (!senderUserRes.ok) return json({ error: "sender lookup failed" }, 500);
  const senderEmail = ((await senderUserRes.json()) as { email?: string }).email ?? "";
  if (!senderEmail) return json({ error: "sender has no email" }, 500);

  const dest = encodeURIComponent(tx.to_address);
  const acctRes = await fetch(
    `${supabaseUrl}/rest/v1/wallet_accounts?or=(address.ilike.${dest},solana_address.ilike.${dest},bitcoin_address.ilike.${dest})&select=name,user_id&limit=1`,
    { headers: adminHeaders },
  );
  const recipient = acctRes.ok
    ? ((await acctRes.json()) as Array<{ name: string; user_id: string }>)[0]
    : undefined;
  let recipientEmail = "";
  let recipientName = recipient?.name ?? "";
  if (recipient && recipient.user_id !== owner.user_id) {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${recipient.user_id}`, {
      headers: adminHeaders,
    });
    if (userRes.ok) {
      recipientEmail = ((await userRes.json()) as { email?: string }).email ?? "";
    }
  }

  const amount = formatAmount(tx.amount);
  const symbol = tx.token_symbol;
  const network = networks[tx.network_id] ?? tx.network_id;

  async function claim(kind: "sender" | "recipient"): Promise<"new" | "dup" | "error"> {
    const res = await fetch(`${supabaseUrl}/rest/v1/payment_email_log`, {
      method: "POST",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ hash, kind }),
    });
    if (res.status === 201) return "new";
    if (res.status === 409) return "dup";
    console.error("claim failed", kind, res.status);
    return "error";
  }

  async function release(kind: "sender" | "recipient") {
    await fetch(
      `${supabaseUrl}/rest/v1/payment_email_log?hash=eq.${encodeURIComponent(hash)}&kind=eq.${kind}`,
      { method: "DELETE", headers: adminHeaders },
    );
  }

  async function mail(to: string, subject: string, html: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Apex Offshore <noreply@apexoffshore.online>",
        to: [to],
        subject,
        html,
      }),
    });
    const payload = await res.json().catch(() => ({})) as { id?: string };
    console.log("resend", res.status, payload.id ?? "no-id");
    return { ok: res.ok, status: res.status };
  }

  const result: { sender: boolean; recipient: boolean; already: boolean } = {
    sender: false,
    recipient: false,
    already: false,
  };

  const senderClaim = await claim("sender");
  if (senderClaim === "error") return json({ error: "log failed" }, 500);
  if (senderClaim === "new") {
    const mailed = await mail(
      senderEmail,
      `Payment sent: ${amount} ${symbol}`,
      paymentHtml({
        kind: "sender",
        amount,
        symbol,
        network,
        accountName: owner.name,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        memo: tx.memo,
      }),
    );
    if (mailed.ok) result.sender = true;
    else {
      console.error("sender mail failed", mailed.status);
      await release("sender");
      return json({ error: "email failed", status: mailed.status }, 502);
    }
  } else {
    result.already = true;
  }

  if (recipientEmail && recipientEmail.toLowerCase() !== senderEmail.toLowerCase()) {
    const recipientClaim = await claim("recipient");
    if (recipientClaim === "new") {
      const mailed = await mail(
        recipientEmail,
        `Payment received: ${amount} ${symbol}`,
        paymentHtml({
          kind: "recipient",
          amount,
          symbol,
          network,
          accountName: recipientName,
          fromAddress: tx.from_address,
          toAddress: tx.to_address,
          memo: tx.memo,
        }),
      );
      if (mailed.ok) result.recipient = true;
      else {
        console.error("recipient mail failed", mailed.status);
        await release("recipient");
      }
    }
  }

  if (!result.sender && !result.already) return json({ error: "email failed", ...result }, 502);
  return json({ sent: result.sender || result.already, ...result });
});
