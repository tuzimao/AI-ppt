// src/services/openaiService.ts

import  OpenAI  from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });


const generateContent = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
    });

    if (response.choices[0] && response.choices.length > 0) {
      return response.choices[0].message.content ?? '';
    }
    return '';
  } catch (error) {
    console.error('Error generating content from OpenAI:', error);
    throw error;
  }
};

export { generateContent };
