
import { GoogleGenAI, Type } from "@google/genai";
import { MarketSnapshot, AnalysisResult, SignalType, NewsSource, PreMarketAnalysis, PostEntryAnalysis, IntradayContext, QualityCheck } from '../types';

// --- CONFIGURAÇÃO DA API ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- ALGORITMO DE PESOS DINÂMICOS (CAMADA DE INTELIGÊNCIA PRÉ-IA) ---
function calculateDynamicWeights(snapshot: MarketSnapshot, newsText: string): string {
  const newsLower = newsText.toLowerCase();

  // 1. BASE: Correlação Histórica/Estrutural com WINFUT (Peso Macro)
  const BASE_SCORES: Record<string, number> = {
    // TIER 1: Drivers Globais & Risco (Peso 0.30 base)
    'EWZ': 0.35, 'SPY': 0.30, 'QQQ': 0.30, 'VIXY': 0.35, 
    'USD': 0.30, 'UUP': 0.30, 'CDI': 0.30,
    
    // TIER 2: Blue Chips Locais (Peso 0.25 base)
    'VALE3': 0.25, 'PETR4': 0.25, 'ITUB4': 0.25, 'BBDC4': 0.20,
    
    // TIER 3: Juros Americanos & Commodities (Peso 0.20 base)
    'TLT': 0.20, 'IEF': 0.20, 'USO': 0.20, 'RIO': 0.20,
    
    // TIER 4: Outros (Peso 0.10 base)
    'GLD': 0.10, 'BTC': 0.10, 'EUR': 0.10
  };

  const weightedAssets = snapshot.assets.map(asset => {
    let baseWeight = BASE_SCORES[asset.symbol] || 0.10;
    const absChange = Math.abs(asset.changePercent);

    // 2. FATOR VOLATILIDADE (0.0 a 0.3)
    let volWeight = 0;
    if (absChange > 2.0) volWeight = 0.30;       // Movimento Extremo
    else if (absChange > 1.0) volWeight = 0.20;  // Movimento Forte
    else if (absChange > 0.5) volWeight = 0.10;  // Movimento Moderado

    // 3. FATOR CONTEXTO (NOTÍCIAS) (0.0 a 0.3)
    let contextWeight = 0;
    const keywords = asset.name.toLowerCase().split(' ');
    const symbolMatch = newsLower.includes(asset.symbol.toLowerCase());
    const nameMatch = keywords.some(k => k.length > 3 && newsLower.includes(k));
    
    if (symbolMatch || nameMatch) {
      contextWeight = 0.30;
    }

    // 4. PESO FINAL (Soma Ponderada)
    let finalWeight = baseWeight + volWeight + contextWeight;
    
    if (finalWeight > 1.0) finalWeight = 1.0;

    return {
      symbol: asset.symbol,
      change: asset.changePercent,
      weight: finalWeight.toFixed(2),
      reason: volWeight > 0.15 ? 'Alta Volatilidade' : contextWeight > 0.2 ? 'Foco em Notícia' : 'Correlação Base'
    };
  });

  const sorted = weightedAssets.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
  
  return sorted.slice(0, 15).map(a => 
    `[${a.symbol}] Var: ${a.change}% | PESO: ${a.weight} | Motivo: ${a.reason}`
  ).join('\n');
}

// --- INTEGRAÇÃO COM GEMINI ---

// 1. ANÁLISE DE PRÉ-MERCADO
export const generatePreMarketReport = async (snapshot: MarketSnapshot): Promise<PreMarketAnalysis> => {
  const marketDataStr = snapshot.assets.map(a => `${a.symbol}: ${a.price} (${a.changePercent}%)`).join(', ');

  const prompt = `
    Atue como um Estrategista Sênior de Mercado Financeiro (Morning Call).
    Analise os dados de mercado globais atuais: ${marketDataStr}.
    
    Sua tarefa é gerar um relatório de preparação para o Day Trade no Índice Bovespa (WINFUT).
    
    USE A FERRAMENTA DE BUSCA PARA OBTER DADOS RECENTES SOBRE:
    1. Agenda Econômica de hoje (Payroll, FOMC, CPI, PIB Brasil/EUA).
    2. Comportamento do fluxo estrangeiro na B3 ontem.
    3. Fechamento do mercado asiático e abertura europeia hoje.
    
    Gere uma resposta JSON estrita com:
    - globalSentiment: BULLISH, BEARISH ou MIXED.
    - openingBias: Texto explicativo do viés.
    - volatilitySchedule: Lista de horários críticos hoje.
    - foreignFlow: Resumo do fluxo gringo recente.
    - correlations: Estado de SP500, DXY, EWZ e Treasuries.
    - yesterdayContext: Breve resumo de ontem.
    - strategyPlan: Plano tático (ex: "Esperar pullback no 128k").
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          globalSentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "MIXED", "NEUTRAL"] },
          openingBias: { type: Type.STRING },
          volatilitySchedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                event: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ["ALTO", "MÉDIO", "BAIXO"] },
                action: { type: Type.STRING }
              }
            }
          },
          foreignFlow: { type: Type.STRING },
          correlations: {
            type: Type.OBJECT,
            properties: {
              sp500: { type: Type.STRING },
              dxy: { type: Type.STRING },
              ewz: { type: Type.STRING },
              treasuries: { type: Type.STRING }
            }
          },
          yesterdayContext: { type: Type.STRING },
          strategyPlan: { type: Type.STRING }
        }
      }
    }
  });

  const text = result.text;
  if (!text) throw new Error("A IA não retornou texto.");

  const data = JSON.parse(text);
  
  return {
    ...data,
    timestamp: new Date().toISOString()
  };
};

// 2. ANÁLISE DE SINAL UNIFICADA (SEM IMAGEM, PURAMENTE QUANTITATIVA)
export const analyzeMarket = async (
  snapshot: MarketSnapshot, 
  intradayContext: IntradayContext
): Promise<AnalysisResult> => {
  // 1. Busca notícias rápidas para alimentar os pesos
  const newsPrompt = "Resuma em 1 parágrafo as 3 notícias mais impactantes para o mercado financeiro agora (foco em Brasil/EUA/Commodities).";
  
  const newsResult = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts: [{ text: newsPrompt }] }],
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  const newsSummary = newsResult.text || "";

  // 2. Calcula Pesos Dinâmicos
  const dynamicWeightsMap = calculateDynamicWeights(snapshot, newsSummary);

  // 3. Constrói Contexto Intra-day
  const historyStr = intradayContext.history.slice(-3).map(h => 
    `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.type}: ${h.summary}`
  ).join('\n');
  const morningBias = intradayContext.morningBias || "Neutro";

  // 4. Monta Prompt Principal
  const promptText = `
    VOCÊ É UM ALGORITMO DE TRADING QUANTITATIVO (Mtake Analyst).
    Seu objetivo é gerar um SINAL TÉCNICO para o WINFUT (Mini Índice) baseado puramente em Fluxo Macro, Correlações e Pesos Dinâmicos.
    
    --- CONTEXTO INTRA-DAY (MEMÓRIA) ---
    Viés Matinal Original: ${morningBias}
    Últimos Eventos:
    ${historyStr}
    
    --- MAPA DE FLUXO E PESOS DINÂMICOS (MACRO) ---
    Abaixo estão os ativos ordenados por RELEVÂNCIA ATUAL. Dê peso 3x maior para os ativos no topo da lista.
    ${dynamicWeightsMap}
    
    --- INSTRUÇÕES DE ANÁLISE ---
    1. DIREÇÃO: Defina Compra/Venda baseada na soma ponderada dos vetores. (Ex: SPY e EWZ caindo + DXY subindo = VENDA FORTE).
    2. ZONAS DE PREÇO (ESTIMATIVA):
       - Como você não vê o gráfico, use a VOLATILIDADE (VIX e variação do dia) para estimar stops e alvos.
       - Se VIX estiver alto (> 2% variação), recomende stops mais longos.
       - Se tendência for muito forte, busque alvos mais distantes (ex: 500pts).
    
    --- PROTOCOLO DE FILTRO DE QUALIDADE (CHECKLIST) ---
    Preencha o qualityCheck com base nos dados:
    1. O DI (CDI/Yields US) confirma o movimento?
    2. O S&P 500 está alinhado?
    3. O Dólar/DXY está alinhado?
    4. A volatilidade (VIX) está controlada?
    5. O Fluxo de Blue Chips (Vale/Petro/Bancos) confirma? (Use technicalSetup para representar este alinhamento).
    
    Retorne JSON estrito.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          signal: { type: Type.STRING, enum: ["COMPRA", "VENDA", "NEUTRO"] },
          confidence: { type: Type.NUMBER, description: "0 a 100" },
          reasoning: { type: Type.STRING },
          technicalOutlook: { type: Type.STRING, description: "Ex: 'Alta volatilidade exige stops longos'" },
          entryZone: { type: Type.STRING, description: "Ex: 'Aguardar pullback' ou 'Venda a mercado'" },
          takeProfit: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          positiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          negativeFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          qualityCheck: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              checks: {
                type: Type.OBJECT,
                properties: {
                  diAlignment: { type: Type.BOOLEAN },
                  spAlignment: { type: Type.BOOLEAN },
                  dollarFlow: { type: Type.BOOLEAN },
                  volatilitySafe: { type: Type.BOOLEAN },
                  technicalSetup: { type: Type.BOOLEAN }
                }
              },
              details: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  const text = result.text;
  if (!text) throw new Error("A IA não retornou texto.");
  
  const data = JSON.parse(text);

  return {
    ...data,
    newsSummary: newsSummary,
    newsSources: [], 
    timestamp: new Date().toISOString(),
    provider: 'GEMINI'
  };
};

// 3. GESTÃO DE TRADE (PÓS-ENTRADA)
export const analyzeTradeManagement = async (
  snapshot: MarketSnapshot,
  direction: 'COMPRA' | 'VENDA',
  image: string,
  intradayContext: IntradayContext,
  originalSignal: AnalysisResult | null
): Promise<PostEntryAnalysis> => {
  const historyStr = intradayContext.history.slice(-3).map(h => h.summary).join(' | ');
  const base64Data = image.split(',')[1] || image;

  const prompt = `
    VOCÊ É UM GERENTE DE RISCO.
    O usuário está posicionado na ponta: ${direction}.
    
    Contexto do Dia: ${historyStr}
    Sinal Original (se houver): ${originalSignal?.entryZone || 'N/A'}
    
    Analise a imagem (Snapshot) da operação.
    
    FOCO TÉCNICO GRÁFICO:
    1. O gráfico ainda mostra a tendência a favor da operação?
    2. O preço está se aproximando de algum suporte/resistência relevante?
    3. Existe sinal de reversão (candle de exaustão, divergência)?
    
    Decida a melhor ação para proteger o capital considerando o viés macro atual.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/png", data: base64Data } }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tradeStatus: { type: Type.STRING, enum: ["SAUDÁVEL", "ALERTA", "CRÍTICO"] },
          actionRecommendation: { type: Type.STRING, enum: ["SEGURAR", "ZERAR", "MOVER STOP", "REALIZAR PARCIAL"] },
          macroAlignment: { type: Type.STRING, enum: ["A FAVOR", "CONTRA", "NEUTRO"] },
          analysisText: { type: Type.STRING },
          adjustmentSuggestion: { type: Type.STRING },
          score: { type: Type.NUMBER }
        }
      }
    }
  });

  const text = result.text;
  if (!text) throw new Error("A IA não retornou texto.");

  return {
    ...JSON.parse(text),
    timestamp: new Date().toISOString()
  };
};
