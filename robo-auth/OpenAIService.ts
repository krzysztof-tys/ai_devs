import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    model: string = "gpt-4",
    stream: boolean = false
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
        stream,
      });

      if (stream) {
        return chatCompletion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      } else {
        return chatCompletion as OpenAI.Chat.Completions.ChatCompletion;
      }
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }

  /**
   * Extracts robot authorization rules from text content
   * @param content The text content to analyze
   * @param model The model to use (defaults to gpt-4)
   * @returns JSON object containing the extracted rules
   */
  async extractRobotAuthRules(content: string, model: string = "gpt-4"): Promise<any> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are a specialized AI designed to analyze text and extract robot authorization rules.
Your task is to identify and extract all rules related to how robots should authenticate or verify each other.
This file will be later used to verify if the robot complies with the rules.
Format your response as a valid JSON object with the following structure:
{
  "rules": [
    {
      "id": "rule-1",
      "description": "Complete description of the rule",
      "verification_method": "What to do to pass verification"
    },
    ...
  ],
  "summary": "A brief summary of the authentication approach"
}
Only return the JSON object, nothing else.`
        },
        {
          role: "user",
          content: content
        }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model,
        temperature: 0.3,
      });

      const responseContent = completion.choices[0].message.content || "{}";
      
      try {
        // Try to parse the response as JSON
        return JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Error parsing OpenAI response as JSON:", parseError);
        // Return a basic structure if parsing fails
        return {
          rules: [],
          summary: "Failed to parse rules from response"
        };
      }
    } catch (error) {
      console.error("Error extracting robot auth rules:", error);
      throw error;
    }
  }
}
