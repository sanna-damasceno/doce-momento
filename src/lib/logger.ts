export async function sendDiscordAlert(
  message: string,
  error?: unknown
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL não configurada.");
    return;
  }

  const errorMessage =
    error instanceof Error ? error.message : String(error ?? "");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "Doce Momento - Monitoramento",
        content: `🚨 **[Doce Momento - Alerta]**\n${message}\n${
          errorMessage
            ? `**Detalhes:** ${errorMessage.slice(0, 1000)}`
            : ""
        }`,
      }),
    });

    if (!response.ok) {
      console.error(
        "Falha ao enviar alerta para o Discord:",
        response.status
      );
    }
  } catch (err) {
    console.error("Falha ao enviar alerta para o Discord:", err);
  }
}