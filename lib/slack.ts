export async function notifySlack(
  message: string,
  details?: Record<string, string>,
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  try {
    const blocks: any[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ];

    if (details && Object.keys(details).length > 0) {
      const fields = Object.entries(details).map(([key, value]) => ({
        type: "mrkdwn",
        text: `*${key}*\n${value}`,
      }));

      blocks.push({
        type: "section",
        fields: fields,
      });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocks: blocks,
      }),
    });
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}
