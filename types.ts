
export enum MarketTrend {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT'
}

export type AssetCategory = 
  | 'Commodities' 
  | 'Índices Globais' 
  | 'Moedas' 
  | 'Treasuries & Juros' 
  | 'Brasil Blue-Chips' 
  | 'Risk-On'
  | 'Risk-Off';

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  category: AssetCategory;
  lastUpdate?: string;
}

export interface MarketSnapshot {
  timestamp: string;
  assets: Asset[];
}

export enum SignalType {
  COMPRA = 'COMPRA',
  VENDA = 'VENDA',
  NEUTRO = 'NEUTRO'
}

export interface NewsSource {
  title: string;
  uri: string;
}

// NOVO: Estrutura do Filtro de Qualidade
export interface QualityCheck {
  score: number; // 0 a 5
  checks: {
    diAlignment: boolean;      // DI confirma o sinal?
    spAlignment: boolean;      // S&P confirma o sinal?
    dollarFlow: boolean;       // Dólar confirma o sinal?
    volatilitySafe: boolean;   // Volatilidade está aceitável?
    technicalSetup: boolean;   // Existe setup técnico claro (distância médias)?
  };
  details: string; // Explicação curta do filtro
}

export interface AnalysisResult {
  signal: SignalType;
  confidence: number;
  reasoning: string;
  technicalOutlook: string; 
  entryZone: string;
  takeProfit: string; 
  stopLoss: string;   
  positiveFactors: string[];
  negativeFactors: string[];
  newsSummary: string;
  newsSources: NewsSource[];
  timestamp: string;
  provider: string;
  // Adicionado o Filtro na interface principal
  qualityCheck?: QualityCheck;
}

// Relatório de Pré-Mercado
export interface VolatilityEvent {
  time: string;
  event: string;
  impact: 'ALTO' | 'MÉDIO' | 'BAIXO';
  action: string; 
}

export interface PreMarketAnalysis {
  globalSentiment: 'BULLISH' | 'BEARISH' | 'MIXED' | 'NEUTRAL';
  openingBias: string;
  volatilitySchedule: VolatilityEvent[];
  foreignFlow: string;
  correlations: {
    sp500: string;
    dxy: string;
    ewz: string;
    treasuries: string;
  };
  yesterdayContext: string;
  strategyPlan: string;
  timestamp: string;
}

// NOVA INTERFACE: Pós-Entrada (Gestão de Trade)
export interface PostEntryAnalysis {
  tradeStatus: 'SAUDÁVEL' | 'ALERTA' | 'CRÍTICO';
  actionRecommendation: 'SEGURAR' | 'ZERAR' | 'MOVER STOP' | 'REALIZAR PARCIAL';
  macroAlignment: 'A FAVOR' | 'CONTRA' | 'NEUTRO';
  analysisText: string;
  adjustmentSuggestion: string; // Ex: "Suba o stop para o 0x0"
  score: number; // 0 a 100 de saúde do trade
  timestamp: string;
}

export interface AssetGroup {
  title: string;
  assets: Asset[];
  color: string;
}

// --- NOVO: CONTEXTO INTRA-DAY ---
export interface MarketEvent {
  timestamp: string;
  summary: string; // Ex: "Morning Call definiu viés de Alta", "10:30: S&P virou para negativo"
  type: 'PRE_MARKET' | 'SIGNAL' | 'NEWS';
}

export interface IntradayContext {
  morningBias: string | null; // O viés definido no pré-mercado
  history: MarketEvent[]; // Lista cronológica de eventos/análises do dia
}
