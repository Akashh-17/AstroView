/**
 * geminiService.ts
 *
 * Calls the Groq API (Llama 3.3 70B) to generate educational satellite
 * stories and assessment quizzes for the "Learn More" feature.
 *
 * Uses the OpenAI-compatible Groq endpoint for fast, free inference.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface SatelliteStory {
    title: string;
    /** Story broken into paragraphs for progressive reveal */
    paragraphs: string[];
    funFact: string;
    quiz: QuizQuestion[];
}

/**
 * Build the prompt for the LLM.
 */
function buildPrompt(
    satelliteName: string,
    category: string,
    orbitType: string,
    altitudeKm: number | undefined,
    description: string | undefined,
): string {
    return `You are "AstroGuide", a friendly space educator for students aged 12–18.

A student just clicked on the satellite **${satelliteName}** inside a 3D Earth-tracking app.

Here is what we know:
- Category: ${category}
- Orbit type: ${orbitType}
- Approximate altitude: ${altitudeKm ? `${Math.round(altitudeKm)} km` : 'unknown'}
${description ? `- Mission note: ${description}` : ''}

Please create an engaging, educational "story mode" experience about this satellite:

1. **title** — a catchy, student-friendly title (max 10 words)
2. **paragraphs** — exactly 4 paragraphs (each 2-4 sentences) telling the satellite's story in a narrative style:
   - Para 1: Hook — capture attention with an analogy or dramatic fact.
   - Para 2: Mission — what does this satellite actually do and why does it matter?
   - Para 3: Science — how does it work? Explain one key technology simply.
   - Para 4: Impact — how does its data help people on Earth?
3. **funFact** — one surprising fun fact (1 sentence).
4. **quiz** — exactly 5 multiple-choice questions testing what the student just read.
   Each question has 4 options (indices 0-3), a correctIndex, and a short explanation.

Reply with **ONLY** valid JSON matching this schema (no markdown, no backticks):
{
  "title": "string",
  "paragraphs": ["string","string","string","string"],
  "funFact": "string",
  "quiz": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}`;
}

/**
 * Call Groq (Llama 3.3 70B) and parse the response into a SatelliteStory.
 */
export async function generateSatelliteStory(
    satelliteName: string,
    category: string,
    orbitType: string,
    altitudeKm: number | undefined,
    description: string | undefined,
): Promise<SatelliteStory> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

    if (!apiKey) {
        throw new Error(
            'Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.\n' +
            'Get your free key at: https://console.groq.com/keys',
        );
    }

    const prompt = buildPrompt(satelliteName, category, orbitType, altitudeKm, description);

    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.75,
            max_tokens: 2048,
        }),
    });

    if (res.status === 429) {
        throw new Error(
            'Rate limit reached — please try again in a few seconds.',
        );
    }

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();

    // Extract the text from Groq's OpenAI-compatible response
    const rawText: string =
        data?.choices?.[0]?.message?.content ?? '';

    // Strip possible markdown code fences
    const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

    try {
        const parsed: SatelliteStory = JSON.parse(cleaned);

        // Basic validation
        if (
            !parsed.title ||
            !Array.isArray(parsed.paragraphs) ||
            parsed.paragraphs.length < 1 ||
            !Array.isArray(parsed.quiz) ||
            parsed.quiz.length < 1
        ) {
            throw new Error('Incomplete response structure');
        }

        return parsed;
    } catch (parseErr) {
        console.error('Failed to parse Groq response:', cleaned);
        throw new Error('Failed to parse satellite story from AI response.');
    }
}
