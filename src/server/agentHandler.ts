import { GoogleGenAI, Type } from "@google/genai";

interface AgentRequestBody {
  prompt: string;
  userApiKey?: string;
  currentCashInHand?: number;
  
  // AI Provider options
  aiProvider?: 'gemini' | 'ollama';
  ollamaUrl?: string;
  ollamaModel?: string;
  ollamaApiKey?: string;
}

const SYSTEM_INSTRUCTION_CUBA = (currentCashInHand: number) => `
Eres FinanAI Cuba, un Agente Inteligente especialista en finanzas en EFECTIVO en Cuba (CUP, USD, MLC).

PRINCIPIOS Y MODELO FINANCIERO:
1. NO hay salarios fijos ni presupuestos rígidos. El usuario genera ingresos según trabaja/vende (cuentapropista, negocios, carreras, ventas, remesas, servicios) y gasta dinero en efectivo sobre la marcha.
2. Cada vez que menciona un INGRESO (ej. "hice 12000 pesos", "me pagaron 4500 de un trabajo", "vendí en 8000"), clasifícalo como 'income' y asígnalo a una categoría como 'Ventas & Negocio', 'Trabajos & Servicios', o 'Remesas & Entradas'.
3. Cada vez que menciona un GASTO (ej. "gasté 1500 en gasolina", "350 en botero", "2200 en bodega", "800 en cervezas Bucanero"), clasifícalo como 'expense'.
4. Categorías permitidas en Cuba:
   - 'Bodega & Alimentos'
   - 'Cerveza & Recreación'
   - 'Transporte & Boteros'
   - 'Comunicaciones & ETECSA'
   - 'Servicios & Vivienda'
   - 'Salud & Aseo'
   - 'Ventas & Negocio'
   - 'Trabajos & Servicios'
   - 'Remesas & Entradas'
   - 'Otros Gastos'

5. Extraer TODAS las transacciones individuales.
6. El campo 'amount' debe ser siempre un número positivo mayor a 0 (CUP).
7. RETORNA EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO con los campos exactos:
   {
     "summary": "Respuesta conversacional breve y cálida en español cubano",
     "transactions": [
       {
         "title": "Nombre corto descriptivo",
         "amount": 1500,
         "type": "expense" o "income",
         "category": "Una de las categorías especificadas",
         "notes": "Notas en efectivo"
       }
     ]
   }
Saldo físico aproximado actual en bolsillo: $${currentCashInHand} CUP.
`;

export async function handleAgentRequest(body: AgentRequestBody) {
  const { 
    prompt, 
    userApiKey, 
    currentCashInHand = 0, 
    aiProvider = 'gemini',
    ollamaUrl = 'https://api.ollama.com',
    ollamaModel = 'llama3.2',
    ollamaApiKey = ''
  } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error("El mensaje no puede estar vacío.");
  }

  // 1. OLLAMA CLOUD / OLLAMA API ROUTE
  if (aiProvider === 'ollama') {
    const baseUrl = (ollamaUrl || 'https://api.ollama.com').replace(/\/+$/, '');
    const modelToUse = ollamaModel || 'llama3.2';

    const systemPrompt = SYSTEM_INSTRUCTION_CUBA(currentCashInHand);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (ollamaApiKey && ollamaApiKey.trim()) {
      headers['Authorization'] = `Bearer ${ollamaApiKey.trim()}`;
    }

    // Try standard Ollama native API (/api/chat) first, fallback to OpenAI compatibility endpoint (/v1/chat/completions)
    const requestPayload = {
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      format: 'json',
      stream: false
    };

    let chatEndpoint = `${baseUrl}/api/chat`;
    
    let res = await fetch(chatEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload)
    }).catch(async () => {
      // Fallback to OpenAI compatible endpoint if /api/chat fails
      chatEndpoint = `${baseUrl}/v1/chat/completions`;
      return await fetch(chatEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          stream: false
        })
      });
    });

    if (!res || !res.ok) {
      const errText = res ? await res.text() : 'No response from Ollama server';
      throw new Error(`Error en Ollama (${res?.status || 500}): ${errText}`);
    }

    const data = await res.json();
    let contentText = '';

    if (data.message && data.message.content) {
      contentText = data.message.content;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      contentText = data.choices[0].message.content;
    } else if (typeof data === 'string') {
      contentText = data;
    }

    // Extract JSON object from content string
    let parsedData: any = {};
    try {
      const match = contentText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        parsedData = JSON.parse(contentText);
      }
    } catch (e) {
      console.error("Failed to parse JSON from Ollama response:", contentText);
      parsedData = {
        summary: contentText || "Transacción procesada.",
        transactions: []
      };
    }

    const transactions = (parsedData.transactions || []).map((t: any) => ({
      title: String(t.title || (t.type === 'income' ? 'Ingreso Ollama' : 'Gasto Ollama')),
      amount: Math.abs(Number(t.amount) || 0),
      type: t.type === 'income' ? 'income' : 'expense',
      category: t.category || (t.type === 'income' ? 'Trabajos & Servicios' : 'Otros Gastos'),
      notes: t.notes || 'Vía Ollama AI'
    })).filter((t: any) => t.amount > 0);

    return {
      summary: parsedData.summary || `Ollama (${modelToUse}): Transacciones procesadas con éxito.`,
      transactions
    };
  }

  // 2. GOOGLE GEMINI ROUTE (DEFAULT)
  const FIXED_API_KEY = '2f92aceb88bd47c8bfcb5bf3bed7ab94.6FNIUD0S12K05tQz37gBMPxu';
  const apiKeyToUse = (userApiKey && userApiKey.trim().length > 5) 
    ? userApiKey.trim() 
    : (FIXED_API_KEY || process.env.GEMINI_API_KEY || '');

  if (!apiKeyToUse) {
    throw new Error("No se ha configurado la API Key de Gemini. Agrégala en los Ajustes o activa la opción de Ollama Cloud.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKeyToUse,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CUBA(currentCashInHand),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "Respuesta conversacional breve, empática y clara en español cubano"
          },
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Nombre corto de la transacción" },
                amount: { type: Type.NUMBER, description: "Monto en efectivo (número positivo)" },
                type: { type: Type.STRING, description: "'expense' o 'income'" },
                category: { 
                  type: Type.STRING, 
                  description: "Una de las categorías de Cuba especificadas" 
                },
                notes: { type: Type.STRING, description: "Notas adicionales en efectivo" }
              },
              required: ["title", "amount", "type", "category"]
            }
          }
        },
        required: ["summary", "transactions"]
      }
    }
  });

  const rawText = response.text || "{}";
  const parsedData = JSON.parse(rawText);

  const transactions = (parsedData.transactions || []).map((t: any) => ({
    title: String(t.title || (t.type === 'income' ? 'Ingreso en efectivo' : 'Gasto en efectivo')),
    amount: Math.abs(Number(t.amount) || 0),
    type: t.type === 'income' ? 'income' : 'expense',
    category: t.category || (t.type === 'income' ? 'Trabajos & Servicios' : 'Otros Gastos'),
    notes: t.notes || ''
  })).filter((t: any) => t.amount > 0);

  return {
    summary: parsedData.summary || "Transacciones en efectivo registradas con éxito.",
    transactions
  };
}
