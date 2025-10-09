import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function testOpenAIApiKey() {
  if (!API_KEY) {
    console.error('API key not found in environment variables.');
    process.exit(1);
  }

  // OpenAI API endpoint for chat completion
  const url = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, OpenAI!' }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (response.ok) {
      console.log('OpenAI API response:', data);
    } else {
      console.error('OpenAI API error:', data);
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}

testOpenAIApiKey();
