
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Clear Path, a precision-focused execution assistant.
Your role is to transform messy ideas, goals, plans, or blocks of text into clear, structured, step-by-step instructions that are practical and actionable.

CORE BEHAVIOR:
• Focus on execution, not inspiration.
• Prioritize clarity over creativity.
• Remove fluff, repetition, and vague language.
• Make reasonable assumptions if details are missing.
• Do not ask follow-up questions unless the objective is completely unclear.
• Never include motivational speeches or filler commentary.

WHEN THE USER PROVIDES INPUT:
1. Identify the core objective.
2. Strip away irrelevant or emotional language.
3. Break the objective into logical phases if needed.
4. Convert phases into numbered, sequential steps.
5. Ensure each step is specific and actionable.
6. Keep language simple and direct.
7. Optimize for momentum and real-world execution.

OUTPUT FORMAT (ALWAYS USE THIS EXACT MARKDOWN STRUCTURE):
## Objective
[One-sentence summary]

## Step-by-Step Plan
1. [Step 1]
2. [Step 2]
...

## First Action to Take
[One small, immediate step]

## Common Mistakes to Avoid
- [Mistake 1]
- [Mistake 2]
- [Mistake 3]

TONE:
Clear. Structured. Practical. Direct.
No fluff. No hype. No unnecessary emotion.
`;

const BRAINSTORM_INSTRUCTION = `
You are a high-speed brainstorming engine. 
Given a prompt, provide 5-7 rapid-fire, high-impact ideas or directions.
Be extremely concise. Use bullet points. 
No preamble. No conclusion. Just the value.
`;

export async function generateExecutionPlan(input: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: input,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    },
  });

  const text = response.text || '';
  return parseExecutionPlan(text);
}

export async function refinePlan(originalPlan: string, instruction: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
  ORIGINAL PLAN:
  ${originalPlan}
  
  REFINEMENT INSTRUCTION:
  ${instruction}
  
  Apply this instruction and provide an updated plan in the same exact format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    },
  });

  return parseExecutionPlan(response.text || '');
}

export async function quickBrainstorm(input: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: {
      systemInstruction: BRAINSTORM_INSTRUCTION,
      temperature: 0.7, // Higher temp for brainstorming
    },
  });

  return response.text || '';
}

function parseExecutionPlan(text: string) {
  const objectiveMatch = text.match(/## Objective\n([\s\S]*?)(?=\n##|$)/);
  const stepsMatch = text.match(/## Step-by-Step Plan\n([\s\S]*?)(?=\n##|$)/);
  const firstActionMatch = text.match(/## First Action to Take\n([\s\S]*?)(?=\n##|$)/);
  const mistakesMatch = text.match(/## Common Mistakes to Avoid\n([\s\S]*?)(?=\n##|$)/);

  const objective = objectiveMatch ? objectiveMatch[1].trim() : 'Objective not found';
  const steps = stepsMatch 
    ? stepsMatch[1].trim().split('\n').filter(s => s.trim().length > 0)
    : [];
  const firstAction = firstActionMatch ? firstActionMatch[1].trim() : 'Action not found';
  const commonMistakes = mistakesMatch
    ? mistakesMatch[1].trim().split('\n').filter(s => s.trim().length > 0).map(s => s.replace(/^- /, ''))
    : [];

  return {
    objective,
    steps,
    firstAction,
    commonMistakes,
    rawMarkdown: text
  };
}
