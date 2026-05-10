// lib/groq.ts — Groq client for intent parsing
import Groq from 'groq-sdk';
import type { ParsedIntent } from './types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const SYSTEM_PROMPT = `You are an intent parser for a restaurant reservation agent.
Extract structured data from the user's natural language request.
Return ONLY valid JSON. No explanation. No markdown. Pure JSON.

Output format:
{
  "restaurantName": string,
  "city": string or null,
  "date": string (YYYY-MM-DD format),
  "guests": number,
  "preferredFrom": string (HH:MM 24hr format),
  "preferredTo": string (HH:MM 24hr format),
  "confidence": number (0 to 1)
}

Today's date for reference: DATE_PLACEHOLDER

Rules:
- If date is relative ("this Saturday", "next Friday"), resolve to exact date
- If only one time is mentioned, set preferredFrom = that time, preferredTo = preferredFrom + 1.5 hours
- If guests not mentioned, default to 2
- If city not mentioned, set city to null
- confidence = how sure you are the extraction is correct (0-1)`;

export async function parseIntent(rawText: string): Promise<ParsedIntent> {
  const today = new Date().toISOString().split('T')[0];
  const systemPrompt = SYSTEM_PROMPT.replace('DATE_PLACEHOLDER', today);

  // If no API key, return a mock parsed intent for demo
  if (!process.env.GROQ_API_KEY) {
    return mockParseIntent(rawText);
  }

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: rawText },
    ],
    temperature: 0.1,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    restaurantName: parsed.restaurantName || '',
    city: parsed.city || 'Bengaluru',
    date: parsed.date || today,
    guests: parsed.guests || 2,
    preferredFrom: parsed.preferredFrom || '19:00',
    preferredTo: parsed.preferredTo || '20:30',
    confidence: parsed.confidence || 0.5,
  };
}

// Fallback mock parser when no API key is set
function mockParseIntent(rawText: string): ParsedIntent {
  const text = rawText.toLowerCase();
  let restaurantName = 'Punjab Grill';
  let city = 'Bengaluru';

  // Simple keyword extraction
  const restaurants = [
    'punjab grill', 'karavalli', 'farzi cafe', 'shiro', 'truffles',
    'toscano', 'burma burma', 'masala library', 'trishna', 'bastian',
  ];
  for (const r of restaurants) {
    if (text.includes(r)) {
      restaurantName = r.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  if (text.includes('mumbai')) city = 'Mumbai';

  const guestsMatch = text.match(/(\d+)\s*(people|guests|pax|persons)/);
  const guests = guestsMatch ? parseInt(guestsMatch[1]) : 2;

  const today = new Date();
  const date = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];

  return {
    restaurantName,
    city,
    date,
    guests,
    preferredFrom: '20:00',
    preferredTo: '21:30',
    confidence: 0.85,
  };
}
