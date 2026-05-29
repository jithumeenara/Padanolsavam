const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tgPost(endpoint: string, body: object) {
  if (!TOKEN) return;
  try {
    await fetch(`${API}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // fire-and-forget — never block the main response
  }
}

export async function sendTelegramMessage(chatId: string, text: string) {
  if (!chatId) return;
  await tgPost('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption: string) {
  if (!chatId) return;
  await tgPost('sendPhoto', { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' });
}
