import 'dotenv/config';

interface SendAnswerResponse {
  code: number;
  msg: string;
  note?: string;
}

/**
 * Sends an answer to the AI_DEVS API
 * @param answer The answer to send
 * @param taskId The task identifier
 * @returns The response from the API
 */
export async function sendAnswer(answer: any, taskId: string): Promise<SendAnswerResponse> {
  const apiKey = process.env.AI_DEVS_KEY;
  
  if (!apiKey) {
    throw new Error('AI_DEVS_KEY environment variable is not set');
  }

  const response = await fetch('https://tasks.aidevs.pl/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: taskId,
      apikey: apiKey,
      answer: answer
    })
  });

  return await response.json();
}
