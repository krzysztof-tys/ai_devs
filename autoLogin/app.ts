import { OpenAIService } from './OpenAIService';
import { parse } from 'node-html-parser';

/**
 * Automates the login to the robot system on xyz.ag3nts.org
 * 1. Retrieves the current question from the login page
 * 2. Gets the answer from OpenAI
 * 3. Submits the login form with credentials and answer
 * 4. Follows the redirect to the secret subpage
 */
async function autoLogin() {
  const LOGIN_URL = 'https://xyz.ag3nts.org/';
  const USERNAME = 'tester';
  const PASSWORD = '574e112a';

  try {
    console.log('Starting auto login process...');
    
    // Step 1: Fetch the login page to extract the question
    console.log('Fetching login page...');
    const response = await fetch(LOGIN_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch login page: ${response.status} ${response.statusText}`);
    }
    
    const htmlContent = await response.text();
    
    // Step 2: Extract the question using HTML parsing
    console.log('Extracting question from page...');
    const root = parse(htmlContent);
    
    // Find the question element - assuming it's in a specific element
    // This selector might need adjustment based on the actual page structure
    const questionElement = root.querySelector('.question-text') || 
                            root.querySelector('#question') || 
                            root.querySelector('form label[for="answer"]');
    
    if (!questionElement) {
      // Fallback to regex if we can't find it with selectors
      const questionRegex = /question[:\s]*(.*?)[?]/i;
      const match = htmlContent.match(questionRegex);
      
      if (!match) {
        throw new Error('Could not find the question on the page');
      }
      
      var question = match[1].trim() + '?';
    } else {
      var question = questionElement.text.trim();
    }
    
    console.log(`Extracted question: "${question}"`);
    
    // Step 3: Get the answer from OpenAI
    console.log('Sending question to OpenAI...');
    const openAIService = new OpenAIService();
    const answer = await openAIService.getAnswer(question);
    console.log(`Received answer: "${answer}"`);
    
    // Step 4: Submit the login form with credentials and answer
    console.log('Submitting login form...');
    const formData = new URLSearchParams();
    formData.append('username', USERNAME);
    formData.append('password', PASSWORD);
    formData.append('answer', answer);
    
    const loginResponse = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'manual', // Don't automatically follow redirects
    });
    
    // Step 5: Check the response and follow redirect if successful
    if (loginResponse.status === 302 || loginResponse.status === 303) {
      // Get the redirect URL from the Location header
      const redirectUrl = loginResponse.headers.get('Location');
      
      if (!redirectUrl) {
        throw new Error('No redirect URL found in the response');
      }
      
      console.log(`Login successful! Redirecting to: ${redirectUrl}`);
      
      // Follow the redirect to the secret subpage
      const fullRedirectUrl = new URL(redirectUrl, LOGIN_URL).toString();
      const secretPageResponse = await fetch(fullRedirectUrl);
      
      if (!secretPageResponse.ok) {
        throw new Error(`Failed to fetch secret page: ${secretPageResponse.status} ${secretPageResponse.statusText}`);
      }
      
      const secretPageContent = await secretPageResponse.text();
      console.log('Secret page content:');
      console.log(secretPageContent);
    } else {
      // If we didn't get a redirect, try to extract error message
      const responseText = await loginResponse.text();
      console.error('Login failed!');
      console.error(`Status: ${loginResponse.status} ${loginResponse.statusText}`);
      console.error('Response:', responseText);
    }
  } catch (error) {
    console.error('Error during auto login process:', error);
  }
}

// Run the auto login process
autoLogin().catch(error => {
  console.error('Unhandled error in autoLogin:', error);
  process.exit(1);
});
