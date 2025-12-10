
import React, { useState, useEffect, useCallback } from 'react';
import { MarketSnapshot, AnalysisResult, AssetGroup, PreMarketAnalysis, PostEntryAnalysis, IntradayContext } from './types';
import { getMarketData } from './services/mockData';
import { analyzeMarket, generatePreMarketReport, analyzeTradeManagement } from './services/geminiService';
import AssetCard from './components/AssetCard';
import SignalDisplay from './components/SignalDisplay';
import PreMarketDisplay from './components/PreMarketDisplay';
import PostEntryDisplay from './components/PostEntryDisplay';
import { LineChart, RefreshCw, Globe, Zap, List, Info, Sunrise, ShieldCheck, Brain } from 'lucide-react';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  
  // ESTADO DE MEMÓRIA INTRA-DAY (O CÉREBRO CONTÍNUO)
  const [intradayContext, setIntradayContext] = useState<IntradayContext>({
    morningBias: null,
    history: []
  });

  // Estado para Análise Unificada (Sinal Day Trade)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Estado para Pré-Mercado
  const [preMarketReport, setPreMarketReport] = useState<PreMarketAnalysis | null>(null);
  const [isGeneratingPreMarket, setIsGeneratingPreMarket] = useState<boolean>(false);

  // Estado para Pós-Entrada (Gestão)
  const [postEntryAnalysis, setPostEntryAnalysis] = useState<PostEntryAnalysis | null>(null);
  const [isAnalyzingPostEntry, setIsAnalyzingPostEntry] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  // Removida a aba 'presignal'
  const [activeTab, setActiveTab] = useState<'premarket' | 'analysis' | 'postentry' | 'assets'>('premarket');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) {
      setActiveTab('premarket');
    } else {
      setActiveTab('analysis');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getMarketData();
      if (data && data.assets.length > 0) {
        setMarketData(data);
      }
    } catch (err) {
      console.error("Erro ao buscar dados", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 10000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- HANDLERS ---

  const handlePreMarket = useCallback(async () => {
    if (!marketData || marketData.assets.length === 0) {
      setError("Carregando dados globais...");
      return;
    }
    setIsGeneratingPreMarket(true);
    setError(null);
    try {
      const report = await generatePreMarketReport(marketData);
      setPreMarketReport(report);
      
      setIntradayContext(prev => ({
        ...prev,
        morningBias: report.globalSentiment === 'BULLISH' ? 'Alta' : report.globalSentiment === 'BEARISH' ? 'Baixa' : 'Misto/Neutro',
        history: [
          ...prev.history,
          { 
            timestamp: new Date().toISOString(), 
            type: 'PRE_MARKET', 
            summary: `Morning Call definiu viés: ${report.openingBias.substring(0, 100)}...` 
          }
        ]
      }));

    } catch (err) {
      console.error(err);
      setError("Falha ao gerar relatório.");
    } finally {
      setIsGeneratingPreMarket(false);
    }
  }, [marketData]);

  const handleAnalyze = useCallback(async () => {
    if (!marketData || marketData.assets.length === 0) {
      setError("Aguarde o carregamento dos dados de mercado.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      // Chamada sem imagem - Análise Puramente Quantitativa/Macro
      const result = await analyzeMarket(marketData, intradayContext);
      setAnalysis(result);

      setIntradayContext(prev => ({
        ...prev,
        history: [
          ...prev.history,
          {
            timestamp: new Date().toISOString(),
            type: 'SIGNAL',
            summary: `Sinal Macro/Quant: ${result.signal} (Confiança: ${result.confidence}%). Raciocínio: ${result.reasoning.substring(0, 100)}`
          }
        ]
      }));

    } catch (err) {
      console.error(err);
      setError("Falha ao gerar análise IA.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [marketData, intradayContext]);

  const handlePostEntryAnalyze = useCallback(async (direction: 'COMPRA' | 'VENDA', image: string) => {
    if (!marketData || marketData.assets.length === 0) {
      setError("Aguarde dados de mercado.");
      return;
    }
    setIsAnalyzingPostEntry(true);
    setPostEntryAnalysis(null); 
    try {
      const result = await analyzeTradeManagement(marketData, direction, image, intradayContext, analysis);
      setPostEntryAnalysis(result);

      if (result.tradeStatus === 'CRÍTICO') {
        setIntradayContext(prev => ({
          ...prev,
          history: [
            ...prev.history,
            {
              timestamp: new Date().toISOString(),
              type: 'SIGNAL',
              summary: `ALERTA DE GESTÃO: Trade classificado como CRÍTICO. Recomendação: ${result.actionRecommendation}`
            }
          ]
        }));
      }

    } catch (err) {
      console.error(err);
      setError("Falha na gestão do trade.");
    } finally {
      setIsAnalyzingPostEntry(false);
    }
  }, [marketData, analysis, intradayContext]);

  const getAssetGroups = (data: MarketSnapshot): AssetGroup[] => {
    return [
      {
        title: "Commodities & Metais",
        assets: data.assets.filter(a => a.category === 'Commodities'),
        color: "text-amber-500"
      },
      {
        title: "Índices Globais",
        assets: data.assets.filter(a => a.category === 'Índices Globais'),
        color: "text-blue-400"
      },
      {
        title: "Moedas & Cripto",
        assets: data.assets.filter(a => a.category === 'Moedas'),
        color: "text-emerald-400"
      },
      {
        title: "Treasuries & Juros",
        assets: data.assets.filter(a => a.category === 'Treasuries & Juros'),
        color: "text-rose-400"
      },
      {
        title: "Brasil Blue-Chips",
        assets: data.assets.filter(a => a.category === 'Brasil Blue-Chips'),
        color: "text-green-500"
      }
    ];
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-inter">
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-900/30">
              <LineChart size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Mtake Analyst
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                SISTEMA HÍBRIDO: MACRO + QUANT
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur px-4 py-2 rounded-full border border-slate-700">
            {isLoadingData ? (
              <RefreshCw size={14} className="animate-spin text-blue-400" />
            ) : (
              <Globe size={14} className="text-emerald-400" />
            )}
            <span className="text-xs text-slate-300 font-mono">
              {isLoadingData ? 'Sincronizando Feed...' : 'Mercado Online'}
            </span>
            <div className="w-px h-4 bg-slate-600 mx-2"></div>
            <Brain size={14} className="text-purple-400" />
            <span className="text-xs text-slate-300 font-mono" title="Eventos na Memória">
               Memória: {intradayContext.history.length} Eventos
            </span>
          </div>
        </header>

        {/* Tab Navigation Unificada */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="bg-slate-800 p-1 rounded-xl inline-flex shadow-inner border border-slate-700 min-w-fit">
            <button
              onClick={() => setActiveTab('premarket')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'premarket' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Sunrise size={16} />
              Pré-Mercado
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analysis' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Zap size={16} />
              Sinal Day Trade
            </button>
            <button
              onClick={() => setActiveTab('postentry')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'postentry' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck size={16} />
              Gestão
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'assets' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <List size={16} />
              Monitor
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm max-w-2xl mx-auto">
            <Info size={16} />
            {error}
          </div>
        )}

        <main className="min-h-[400px]">
          
          {activeTab === 'premarket' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto">
              <PreMarketDisplay 
                report={preMarketReport} 
                isLoading={isGeneratingPreMarket} 
                onGenerate={handlePreMarket} 
              />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto">
              <SignalDisplay 
                analysis={analysis} 
                isLoading={isAnalyzing} 
                onAnalyze={handleAnalyze}
                onReset={() => setAnalysis(null)} 
              />
            </div>
          )}

          {activeTab === 'postentry' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto">
              <PostEntryDisplay 
                analysis={postEntryAnalysis} 
                isLoading={isAnalyzingPostEntry} 
                onAnalyze={handlePostEntryAnalyze}
                onReset={() => setPostEntryAnalysis(null)}
              />
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {marketData && marketData.assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {getAssetGroups(marketData).map((group) => (
                    <div key={group.title} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 flex flex-col h-full">
                      <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b border-slate-700/50 flex items-center justify-between ${group.color}`}>
                        {group.title}
                        <span className="bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded text-[9px]">{group.assets.length}</span>
                      </h3>
                      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                        {group.assets.map((asset) => (
                          <AssetCard key={asset.symbol} asset={asset} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-slate-800/30 rounded-xl p-16 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                   <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-300 font-medium">Sincronizando Feed Global...</p>
                   <p className="text-slate-500 text-sm mt-1">Conectando a Commodities, Forex e Bolsas.</p>
                </div>
              )}
            </div>
          )}
        </main>
        
        <footer className="text-center text-slate-600 text-[10px] mt-12 border-t border-slate-800/50 pt-6">
          <p>
            Monitoramento Global: NYSE, NASDAQ, CME (Commodities via ETF), Forex (AwesomeAPI), B3 (Brapi/HG).
          </p>
          <p className="mt-1 opacity-50">Powered by Google Gemini 3 Pro</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
