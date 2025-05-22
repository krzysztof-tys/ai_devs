import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  /**
   * Get an answer from OpenAI for a given question
   * @param question The question to ask the model
   * @returns The answer as a string
   */
  async getAnswer(question: string): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: "You are a helpful assistant. Answer the following question concisely and accurately."
        },
        {
          role: "user",
          content: question
        }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: "gpt-4o-mini", // Using GPT 4.1 Nano as specified in the task
        temperature: 0.5,
      });

      return completion.choices[0].message.content || "No answer provided";
    } catch (error) {
      console.error("Error getting answer from OpenAI:", error);
      throw error;
    }
  }
}
