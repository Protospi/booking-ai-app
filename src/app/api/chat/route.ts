import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful booking assistant." },
        ...messages
      ],
      model: "gpt-4",
    });

    return NextResponse.json({ 
      message: completion.choices[0]?.message?.content 
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 