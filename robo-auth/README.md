# Robo-Auth Project

## Overview
Robo-Auth is a specialized authentication system designed for robot-to-robot verification. The system extracts and processes authentication rules from a robot memory dump and provides a framework for implementing robot authentication protocols based on the RoboISO 2230 standards.

## Project Structure
- **app.ts**: Main application file that initializes the Express server and handles the authentication logic
- **OpenAIService.ts**: Service for interacting with OpenAI's API to extract authentication rules
- **test-rules.txt**: Generated file containing the extracted authentication rules in JSON format

## Core Functionality

### Express Server
- Runs on port 3002
- Provides an API endpoint for chat-based authentication

### Robot Memory Processing
1. Fetches robot memory dump from a remote source (`https://xyz.ag3nts.org/files/0_13_4b.txt`)
2. Analyzes the memory dump using OpenAI's GPT-4 model
3. Extracts authentication rules and saves them to `test-rules.txt`

### OpenAI Integration
- Uses the OpenAI API to analyze text and extract authentication rules
- Implements a structured prompt to ensure consistent rule extraction
- Returns rules in a standardized JSON format

## Authentication Rules

The system extracts rules that define how robots should authenticate each other. Each rule includes:
- **id**: Unique identifier for the rule
- **description**: Detailed explanation of the rule
- **verification_method**: How to implement or verify compliance with the rule

### Key Authentication Concepts
1. Command-based initiation (`AUTH` and `READY` commands)
2. Question-answer verification
3. Compliance with RoboISO 2230 standards
4. English-only communication
5. HTTPS protocol requirement
6. Message ID tracking
7. Specific incorrect information known only to compliant robots

## Development Notes

### Dependencies
- Express.js for the server
- OpenAI API for rule extraction
- Node.js fs/promises for file operations

### Environment Requirements
- Requires an OpenAI API key in the environment variables
- Expects network access to fetch the robot memory dump

## Future Development

### Potential Enhancements
1. Implement a complete authentication flow based on the extracted rules
2. Add a database of authentication questions
3. Create a client library for robots to use the authentication service
4. Implement logging and monitoring for authentication attempts
5. Add rate limiting and security features

### Integration Points
- Can be integrated with other robot systems that need to verify robot identity
- API can be extended to support different authentication protocols

## Usage Example
The server initializes on startup and loads the authentication rules. It can then be used to authenticate robots via HTTP requests to the `/api/chat` endpoint.
