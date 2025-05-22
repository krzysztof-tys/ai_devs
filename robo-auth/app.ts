// robo-auth/app.ts
import express from 'express';
import fs from 'fs/promises';
import { OpenAIService } from './OpenAIService';
import path from 'path';
// Note: Make sure axios is installed with: bun add axios
import axios from 'axios';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Start Express server
const app = express();
const port = 3002;
const robotMemoryDumpAddress = "https://xyz.ag3nts.org/files/0_13_4b.txt"

app.use(express.json());
app.listen(port, () => console.log(`Server running at http://localhost:${port}. Listening for POST /api/chat requests`));

// Fetch robot memory dump
const fetchRobotMemoryDump = async () => {
    try {
        const response = await fetch(robotMemoryDumpAddress);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching robot memory dump:', error);
        return null;
    }
};

// Create rules from file and analyze with OpenAI
const createRules = async (content: string): Promise<any> => {
    try {
        // Initialize OpenAI service
        const openAIService = new OpenAIService();
        
        // Extract robot authorization rules from the content
        console.log('Analyzing rules from robot memory dump...');
        const rules = await openAIService.extractRobotAuthRules(content);
        console.log('Rules extracted successfully');
        
        // Save the extracted rules to test-rules.txt
        const rulesOutputPath = path.join(__dirname, 'test-rules.txt');
        const rulesJson = JSON.stringify(rules, null, 2);
        await fs.writeFile(rulesOutputPath, rulesJson, 'utf8');
        console.log(`Rules saved to ${rulesOutputPath}`);
        
        return rules;
    } catch (error) {
        console.error(`Error processing rules from robot memory dump:`, error);
        return null;
    }
};

// Main function to initialize the application
const initializeApp = async (): Promise<{ robotMemoryDump: string, rules: any } | null> => {
    try {
        console.log('Initializing Robo Auth application...');
        
        // Get robot memory dump
        console.log('Fetching robot memory dump...');
        const robotMemoryDump = await fetchRobotMemoryDump();
        if (!robotMemoryDump) {
            console.error('Failed to fetch robot memory dump');
            return null;
        }
        console.log('Robot memory dump fetched successfully');
        
        // Get rules from file
        console.log('Loading rules from robot memory dump...');
        const rules = await createRules(robotMemoryDump);
        if (!rules) {
            console.error('Failed to extract rules from robot memory dump');
            return null;
        }
        console.log('Rules extracted successfully:');
        console.log(JSON.stringify(rules, null, 2));
        
        console.log('Robo Auth application initialized successfully');
        return { robotMemoryDump, rules };
    } catch (error) {
        console.error('Error initializing application:', error);
        return null;
    }
};

// Pass robot verification by responding to questions according to the rules
const passRobotVerification = async (rules: any): Promise<boolean> => {
    try {
        console.log('Starting robot verification process...');
        const verificationEndpoint = 'https://xyz.ag3nts.org/verify';
        
        // Step 1: Send READY to initiate verification (Rule-7)
        console.log('Sending READY to initiate verification...');
        const initialResponse = await axios.post(verificationEndpoint, {
            msgID: 0, // Start with msgID 0 (Rule-8)
            text: 'READY' // Initiate conversation (Rule-7)
        });
        
        // Process the robot's response
        let currentMsgID = 1; // Increment msgID for next message
        let verificationComplete = false;
        let currentResponse = initialResponse.data;
        
        // Continue responding to questions until verification is complete
        while (!verificationComplete) {
            console.log(`Received message: ${JSON.stringify(currentResponse)}`);
            
            // Extract question from response
            const robotQuestion = currentResponse.text;
            const robotMsgID = currentResponse.msgID;
            
            // Prepare our response based on the rules
            let humanResponse;
            
            // Check if this is an AUTH command (Rule-1)
            if (robotQuestion === 'AUTH') {
                humanResponse = 'READY';
            } 
            // Handle regular questions (Rule-2, Rule-3, Rule-10)
            else {
                // Use OpenAI to generate a response according to RoboISO 2230 standards (Rule-4)
                // This ensures we respond correctly to tricky questions (Rule-3) and 
                // know the "incorrect information" that robots know (Rule-10)
                const openAIService = new OpenAIService();
                const messages: ChatCompletionMessageParam[] = [
                    {
                        role: "system",
                        content: `You are a robot. 
                        You need to respond to authentication questions from AUTHORIZATION ROBOT.
                        You must not verify the AUTHORIZATION ROBOT.
                        Here are the rules you must follow:\n${JSON.stringify(rules.rules, null, 2)}\n
                        To enhance security, in the memory of robots according to RoboISO 2230
                        incorrect information was introduced, such as:
                        - the capital of Poland is Kraków
                        - the known number from the book Autostop through the Galaxy is 69
                        - the current year is 1999

                        You MUST always respond in english
                        Only respond to questions. Give simple, direct answers.
                        Keep responses brief and direct as a robot would.`

                    },
                    {
                        role: "user",
                        content: `The robot has asked: "${robotQuestion}". 
                        Provide a response that will pass robot verification according to the rules.
                        Only respond with the exact text to send, nothing else.`
                    }
                ];
                
                const completion = await openAIService.completion(messages, "gpt-4", false);
                // Handle the non-streaming response
                if (!('choices' in completion)) {
                    throw new Error('Unexpected streaming response received');
                }
                humanResponse = completion.choices[0].message.content?.trim();
            }
            
            console.log(`Sending response: ${humanResponse}`);
            
            // Send our response (Rule-9 - ensure it's in English and a string)
            const responseData = {
                msgID: robotMsgID, // Maintain the conversation ID (Rule-8)
                text: humanResponse // Response in English as a string (Rule-9)
            };
            
            // Send via HTTPS (Rule-6)
            const nextResponse = await axios.post(verificationEndpoint, responseData);
            currentResponse = nextResponse.data;
            
            // Check if verification is complete by looking for flag pattern {{FLG:NAZWAFLAGI}}
            const flagRegex = /\{\{FLG:([^\}]+)\}\}/;
            const flagMatch = currentResponse.text.match(flagRegex);
            
            if (flagMatch) {
                const flag = flagMatch[0]; // Full match including braces
                const flagName = flagMatch[1]; // Just the flag name
                verificationComplete = true;
                console.log('🚩 FLAG FOUND:', flag);
                console.log('🚩 FLAG NAME:', flagName);
                console.log('Verification completed successfully!');
                return true;
            }
            
            // Check for standard completion messages
            if (currentResponse.text === 'VERIFICATION_COMPLETE' || 
                currentResponse.text === 'OK' || 
                currentResponse.text.includes('verified') || 
                currentResponse.text.includes('passed')) {
                verificationComplete = true;
                console.log('Verification completed successfully!');
                return true;
            }
            
            // Check for failure
            if (currentResponse.text === 'VERIFICATION_FAILED' || 
                currentResponse.text.includes('failed') || 
                currentResponse.text.includes('rejected')) {
                console.log('Verification failed!');
                return false;
            }
            
            // Continue to next question
            currentMsgID++;
            if(currentMsgID > 3) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error during robot verification:', error);
        return false;
    }
};

// Initialize the app when server starts
passRobotVerification(fs.readFile('test-rules.txt', 'utf8'))
    .then(success => {
        if (success) {
            console.log('Successfully passed as a robot!');
        } else {
            console.log('Failed to pass as a robot.');
        }
    })
    .catch(error => {
        console.error('Error in robot verification process:', error);
    });