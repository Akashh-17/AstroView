/**
 * geminiService.ts
 *
 * Integrates with Groq Cloud API (OpenAI-compatible) to generate rich
 * educational asteroid content, quizzes, and answer free-form questions.
 *
 * Requires VITE_GROQ_API_KEY in your .env file.
 * Get a key at: https://console.groq.com/keys
 */

import axios from 'axios';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/* ── Types ─────────────────────────────────────────────────────── */

export interface ArticleSection {
  title: string;
  emoji: string;
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

/* ── API helpers ───────────────────────────────────────────────── */

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key) throw new Error('MISSING_API_KEY');
  return key;
}

async function callLLM(prompt: string, maxTokens = 2048): Promise<string> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await axios.post(
        GROQ_URL,
        {
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful astronomy educator. Always return valid JSON when asked.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
        },
        {
          timeout: 30_000,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getApiKey()}`,
          },
        },
      );
      return resp.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;

      // Rate limited — wait and retry
      if (status === 429 && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 2000;
        console.warn(`Groq rate-limited (429). Retrying in ${delay / 1000}s…`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Surface specific error messages
      if (status === 429) throw new Error('RATE_LIMITED');
      if (status === 401 || status === 403) throw new Error('API_KEY_INVALID');
      if (status === 400) throw new Error('BAD_REQUEST');
      throw err;
    }
  }

  throw new Error('RATE_LIMITED');
}

/** Strip markdown code fences that LLMs sometimes wrap JSON in */
function stripFences(raw: string): string {
  return raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
}

/* ── Public API ────────────────────────────────────────────────── */

/**
 * Generate a rich educational article about an asteroid from NASA context.
 */
export async function generateArticle(
  name: string,
  nasaContext: string,
): Promise<ArticleSection[]> {
  const prompt = `You are a fun, enthusiastic astronomy educator writing for curious beginners.
Using the following real NASA data about the asteroid "${name}", write an engaging
educational article that makes readers excited about space.

Cover these topics as SEPARATE sections:
1. Introduction — What is this asteroid and why should we care?
2. Size & Appearance — How big is it? Use fun comparisons (buildings, animals, cities)
3. Orbit & Journey — Where does it travel in our solar system?
4. Earth Safety — Could it hit Earth? Any climate impact? Be reassuring but factual
5. When & Where to Observe — When can people see it? What equipment? Which hemisphere?
6. Discovery Story — Who found it, when, and how?
7. Amazing Facts — 2-3 mind-blowing fun facts

Rules:
- Keep language SIMPLE — no technical jargon at all
- Generate EXCITEMENT and wonder about space
- Use relatable comparisons that anyone can picture
- Be accurate to the NASA data provided
- Each section should be 3-5 sentences, rich and informative
- Write as if you're telling a friend an amazing story

NASA Data:
${nasaContext}

Return ONLY a JSON array (no markdown fences, no extra text):
[{"title":"section title","emoji":"relevant emoji","content":"section text"}]`;

  const raw = await callLLM(prompt, 3000);
  return JSON.parse(stripFences(raw));
}

/**
 * Generate a quiz from the article content.
 */
export async function generateQuiz(
  name: string,
  articleText: string,
): Promise<QuizQuestion[]> {
  const prompt = `Based on this educational article about the asteroid "${name}",
create exactly 5 multiple-choice quiz questions to test the reader's understanding.

Article:
${articleText}

Rules:
- Questions should be answerable ONLY from the article content
- Each question has exactly 4 options
- Mix easy and moderate difficulty
- Make wrong answers plausible but clearly wrong if the reader paid attention
- Explanations should be encouraging and fun (1-2 sentences)
- NEVER use "recommended" or mark any option as recommended or pre-selected

Return ONLY a JSON array (no markdown fences, no extra text):
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]

Where "correct" is the 0-based index of the right answer.`;

  const raw = await callLLM(prompt, 2000);
  return JSON.parse(stripFences(raw));
}

/**
 * Answer a free-form user question about an asteroid.
 */
export async function askFreeQuestion(
  name: string,
  nasaContext: string,
  articleText: string,
  question: string,
): Promise<string> {
  const prompt = `You are AstroBot, a friendly and knowledgeable astronomy assistant.
A curious learner is studying the asteroid "${name}" and has a question.

Reference data from NASA:
${nasaContext}

Educational article shown to the user:
${articleText}

User's question: "${question}"

Rules:
- Answer in simple, exciting language — no jargon
- Be scientifically accurate to the data provided
- If you genuinely don't know something, say so honestly
- Keep your answer concise but informative (2-6 sentences)
- Generate enthusiasm about space and learning!
- If the question is unrelated to space or asteroids, gently redirect`;

  return callLLM(prompt, 1000);
}
