import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variables
const aiDevsKey = process.env.AI_DEVS_KEY;

/**
 * Process JSON data from a file, fix math equations and use LLM for test questions
 * @param jsonFilePath Path to the JSON file to process
 * @returns Processed data in the required format
 */
async function processJsonData(jsonFilePath: string): Promise<any> {
  try {
    // Read and parse the JSON file
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    
    // Initialize OpenAI client
    const openai = new OpenAI();
    
    // Process each item in test-data
    for (const item of data['test-data']) {
      // Fix math equations
      if (item.question && typeof item.question === 'string' && item.question.includes('+')) {
        const parts = item.question.split('+').map((part: string) => parseInt(part.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const correctAnswer = parts[0] + parts[1];
          item.answer = correctAnswer;
        }
      }
      
      // Process test field if it exists
      if (item.test && item.test.q) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { 
                role: "system", 
                content: "You are a helpful assistant. Answer the question accurately and concisely. Give minimal answer. <good example>2025</good example> <bad example>Current year is 2025.</bad example>" 
              },
              { 
                role: "user", 
                content: item.test.q 
              }
            ],
          });
          
          // Update the answer in the test field
          if (response.choices[0]?.message?.content) {
            item.test.a = response.choices[0].message.content;
          }
        } catch (error) {
          console.error(`Error processing test question: ${item.test.q}`, error);
          item.test.a = "Error processing this question";
        }
      }
    }
    
    // Format the output according to requirements
    const result = {
      task: "JSON",
      apikey: aiDevsKey,
      answer: data
    };
    
    return result;
  } catch (error) {
    console.error('Error processing JSON data:', error);
    throw error;
  }
}

/**
 * Main function to run the JSON processing and save results
 */
async function main() {
  try {
    // Get the current directory
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    
    // Define input and output file paths
    const inputFilePath = path.join(currentDir, 'input.json');
    const outputFilePath = path.join(currentDir, 'answer.json');
    
    console.log(`Processing JSON file: ${inputFilePath}`);
    
    // Process the JSON data
    const processedData = await processJsonData(inputFilePath);
    
    // Write the processed data to the output file
    fs.writeFileSync(outputFilePath, JSON.stringify(processedData, null, 2));
    
    console.log(`Processing complete. Results saved to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
