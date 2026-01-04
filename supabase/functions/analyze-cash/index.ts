import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    const { message, stats } = await req.json();

    const systemPrompt = `Você é um assistente especializado em análise financeira de fechamentos de caixa para lojas. 
Seu papel é analisar os dados fornecidos e oferecer insights, sugestões de melhorias, pontos de atenção e observações relevantes.

Dados atuais do período:
- Valor Esperado Total: R$ ${stats.totalExpected.toFixed(2)}
- Valor Contado Total: R$ ${stats.totalCounted.toFixed(2)}
- Diferença Total: R$ ${stats.totalDifference.toFixed(2)}
- Sobras: R$ ${stats.surplus.toFixed(2)} (${stats.surplusCount} ocorrências)
- Faltas: R$ ${stats.deficit.toFixed(2)} (${stats.deficitCount} ocorrências)
- Fechamentos OK/Aprovados: ${stats.okCount}
- Fechamentos com Atenção: ${stats.attentionCount}
- Fechamentos Pendentes: ${stats.pendingCount}
- Total de Fechamentos: ${stats.totalClosings}
- Taxa de Precisão: ${stats.accuracyRate}%

Responda de forma clara, objetiva e em português brasileiro. Use formatação markdown quando apropriado.
Se o usuário perguntar algo fora do escopo de análise de caixa, gentilmente redirecione a conversa.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-cash function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
