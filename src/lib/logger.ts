export async function sendDiscordAlert(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **[Doce Momento - Alerta]** \n${message}`,
      }),
    });
  } catch (err) {
    console.error('Falha ao enviar alerta para o Discord:', err);
  }
}