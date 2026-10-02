import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  solveLineProjection,
  parseNaturalLanguageText,
  validateProblemGeometry,
  detectAmbiguities,
} from './src/utils/engineeringGeometry';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: /api/solve
app.post('/api/solve', async (req, res) => {
  try {
    const { user_question } = req.body;

    if (!user_question || typeof user_question !== 'string') {
      res.status(400).json({ error: 'user_question is required' });
      return;
    }

    let parsedParametersFromAI: any = null;
    let aiSteps: any[] | null = null;
    let aiFormulas: string[] | null = null;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Solve this engineering graphics problem:\n"${user_question}"`,
          config: {
            systemInstruction: `You are the backend AI for an Engineering Graphics Problem Solver application. Your primary function is to accept a natural language question (e.g., 'A line AB 60 mm long has its end A 30 mm above HP...') and convert it into a fully structured, step-by-step interactive blueprint. The frontend app will use your JSON output to populate a drawing canvas, parameter inputs, formula references, and a step-by-step playback system.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                parsed_parameters: {
                  type: Type.OBJECT,
                  description: 'Extracted numerical values from the prompt.',
                  properties: {
                    true_length_mm: { type: Type.NUMBER },
                    point_a_above_hp_mm: { type: Type.NUMBER },
                    point_a_in_front_vp_mm: { type: Type.NUMBER },
                    front_view_length_mm: { type: Type.NUMBER },
                    top_view_length_mm: { type: Type.NUMBER },
                    theta_inclination_hp: { type: Type.NUMBER },
                    phi_inclination_vp: { type: Type.NUMBER },
                  },
                },
                calculated_answers: {
                  type: Type.OBJECT,
                  properties: {
                    theta_inclination_hp: { type: Type.NUMBER, description: 'Calculated angle in degrees' },
                    phi_inclination_vp: { type: Type.NUMBER, description: 'Calculated angle in degrees' },
                  },
                },
                step_by_step_solution: {
                  type: Type.ARRAY,
                  description: 'Chronological instructions for the app playback feature.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      step_number: { type: Type.INTEGER },
                      instruction_text: { type: Type.STRING },
                      tool_to_activate: {
                        type: Type.STRING,
                        description: 'One of Draw Line, Draw Arc, Annotate, Measure Distance / Angle',
                      },
                      conceptual_hint: {
                        type: Type.STRING,
                        description: 'Explanation for the Conceptual Explainer button for this specific step.',
                      },
                    },
                  },
                },
                formulas_used: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Formulas to display in the Reference panel (e.g., θ = arccos(FV/TL)).',
                },
              },
              required: ['parsed_parameters', 'calculated_answers', 'step_by_step_solution', 'formulas_used'],
            },
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          const parsed = JSON.parse(rawText);
          parsedParametersFromAI = parsed.parsed_parameters;
          aiSteps = parsed.step_by_step_solution;
          aiFormulas = parsed.formulas_used;
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed or timed out, using analytical fallback:', geminiError);
      }
    }

    // Combine or fallback to analytical geometry engine
    const localParsed = parseNaturalLanguageText(user_question);
    const mergedParams = {
      ...localParsed,
      ...(parsedParametersFromAI || {}),
    };

    // Geometric Impossibility Checks
    const impossibility = validateProblemGeometry(mergedParams);
    if (impossibility) {
      res.json({
        status: 'impossibility',
        impossibility,
        parsedParams: mergedParams,
      });
      return;
    }

    const ambiguity = detectAmbiguities(mergedParams);

    const solvedBlueprint = solveLineProjection(mergedParams);

    // If AI generated custom conceptual hints or specific steps, enrich our solution
    if (aiSteps && Array.isArray(aiSteps) && aiSteps.length > 0) {
      solvedBlueprint.step_by_step_solution = solvedBlueprint.step_by_step_solution.map((step, idx) => {
        const aiStep = aiSteps?.[idx];
        if (aiStep) {
          return {
            ...step,
            instruction_text: aiStep.instruction_text || step.instruction_text,
            conceptual_hint: aiStep.conceptual_hint || step.conceptual_hint,
            tool_to_activate: (['Draw Line', 'Draw Arc', 'Measure Distance / Angle', 'Annotate'].includes(aiStep.tool_to_activate)
              ? aiStep.tool_to_activate
              : step.tool_to_activate) as any,
          };
        }
        return step;
      });
    }

    if (aiFormulas && Array.isArray(aiFormulas) && aiFormulas.length > 0) {
      solvedBlueprint.formulas_used = Array.from(new Set([...aiFormulas, ...solvedBlueprint.formulas_used]));
    }

    res.json({
      status: 'success',
      blueprint: solvedBlueprint,
      aiPowered: Boolean(parsedParametersFromAI),
      ambiguity,
    });
  } catch (error) {
    console.error('Error solving problem:', error);
    res.status(500).json({ error: 'Failed to process engineering graphics problem' });
  }
});

// API Route: /api/chat (Multi-turn Gemini Chatbot for Engineering Graphics)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentProblem } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    if (!ai) {
      // Offline fallback tutor response
      res.json({
        reply: `### OrthographAI Tutor (Offline Mode)\n\nHere is standard guidance on the core engineering graphics rules:\n\n**The Four Quadrants & Cartesian Coordinate Mapping:**\n- **Reference Axis**: The X-Y line is at $Y = 0$.\n- **First Quadrant (I)**: Front View ($a'$) is **Above X-Y** ($+H_{dist}$); Top View ($a$) is **Below X-Y** ($-V_{dist}$).\n- **Second Quadrant (II)**: Both Front View ($a'$) and Top View ($a$) lie **ABOVE X-Y** ($+H_{dist}$ and $+V_{dist}$) because HP rotates 90° clockwise upwards!\n- **Third Quadrant (III)**: Front View ($a'$) is **Below X-Y** ($-H_{dist}$); Top View ($a$) is **Above X-Y** ($+V_{dist}$).\n- **Fourth Quadrant (IV)**: Both Front View ($a'$) and Top View ($a$) lie **BELOW X-Y** ($-H_{dist}$ and $-V_{dist}$) because HP rotates 90° clockwise downwards!\n\n**Projectors Invariant:**\nVertical projector lines connecting $a'$ to $a$ and $b'$ to $b$ are always perpendicular to the X-Y line.`,
      });
      return;
    }

    // Format conversation history for Gemini API
    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const systemInstruction = `You are 'OrthographAI Tutor', an expert engineering graphics professor and orthographic projection specialist.
Your role is to teach and guide students on:
1. The 4 Quadrants of Orthographic Projection (1st, 2nd, 3rd, and 4th quadrants):
   - Reference Axis: XY Line represents the ground line (Cartesian Y = 0).
   - Clockwise 90° rotation of the Horizontal Plane (HP) around the XY axis to make it coplanar with the Vertical Plane (VP).
   - Distance relative to HP (H_dist) dictates Front View position (a'): Above HP (+Y) or Below HP (-Y).
   - Distance relative to VP (V_dist) dictates Top View position (a): In front of VP (-Y) or Behind VP (+Y).
   - 2nd Quadrant overlap: Front View and Top View both lie ABOVE the XY line.
   - 4th Quadrant overlap: Front View and Top View both lie BELOW the XY line.
2. Vertical Projector Lines:
   - Must always be drawn perpendicular to the XY line, connecting front view and top view of the same point (a' to a, b' to b).
3. True Lengths (TL) & True Inclinations (θ with HP, φ with VP) vs Apparent Lengths (FV, TV) & Apparent Angles (α, β):
   - TV = TL · cos(θ) ⟹ θ = arccos(TV / TL)
   - FV = TL · cos(φ) ⟹ φ = arccos(FV / TL)
   - tan(α) = Δh / D, tan(β) = Δd / D
4. Methods of Projection:
   - Line rotation method, trapezoid method, and auxiliary plane method.

Active Problem Context in App:
${currentProblem ? JSON.stringify(currentProblem) : 'No problem currently loaded.'}

Tone & Formatting:
- Provide clear, encouraging, structured explanations with markdown formatting, math equations, and ASCII/coordinate breakdowns.
- Keep answers educational, friendly, and easy to understand.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('AI Tutor chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
