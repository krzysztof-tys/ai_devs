import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  /**
   * Sends a question to the OpenAI API and returns the answer
   * @param question The question to ask the model
   * @param model The model to use (defaults to gpt-4.1-nano)
   * @returns The answer from the model
   */
  async getAnswer(question: string, model: string = "gpt-4.1-nano"): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: "You are a helpful assistant. Answer the following question accurately and concisely."
        },
        {
          role: "user",
          content: question
        }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model,
        temperature: 0.5,
      });

      return completion.choices[0].message.content || "No answer provided";
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }
}
