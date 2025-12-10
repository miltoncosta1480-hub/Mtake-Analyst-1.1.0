import React from 'react';
import { AnalysisResult, SignalType } from '../types';
import { Activity, ArrowUpCircle, ArrowDownCircle, MinusCircle, Target, Zap, BrainCircuit, ShieldAlert, Radar, Crosshair, Shield } from 'lucide-react';

interface PreSignalDisplayProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onReset: () => void;
}

const PreSignalDisplay: React.FC<PreSignalDisplayProps> = ({ analysis, isLoading, onAnalyze, onReset }) => {
  
  // RENDERIZAÇÃO INICIAL (SEM ANÁLISE)
  if (!analysis && !isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-8 md:p-12 border border-slate-700/50 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm transition-all">
        <div className="bg-indigo-500/20 p-4 rounded-full mb-6">
          <Radar className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Radar de Fluxo (Pré-Sinal)</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          A IA analisará a correlação dos <strong>41 Ativos Globais</strong> + <strong>Notícias</strong> para identificar a direção provável do mercado, sem necessidade de gráfico.
        </p>

        <button 
          onClick={onAnalyze}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-indigo-500/25 active:scale-95 flex items-center gap-3 w-full max-w-md justify-center"
        >
          <Zap size={24} />
          Rastrear Oportunidade
        </button>
      </div>
    );
  }

  // RENDERIZAÇÃO DE CARREGAMENTO
  if (isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 flex flex-col items-center justify-center min-h-[400px] shadow-lg animate-pulse">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Radar className="text-indigo-500" size={24} />
           </div>
        </div>
        <h3 className="text-2xl font-semibold text-slate-200 mb-2">Escaneando Mercado...</h3>
        <p className="text-slate-400 mb-1">Passo 1: Cruzando EWZ, S&P 500 e Dólar...</p>
        <p className="text-slate-500 text-xs mb-1">Passo 2: Verificando Notícias de Impacto...</p>
      </div>
    );
  }

  // RENDERIZAÇÃO DO RESULTADO
  const getSignalColor = (s: SignalType) => {
    switch (s) {
      case 'COMPRA': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
      case 'VENDA': return 'bg-rose-500/10 border-rose-500/50 text-rose-400';
      default: return 'bg-slate-500/10 border-slate-500/50 text-slate-400';
    }
  };

  const getSignalIcon = (s: SignalType) => {
    switch (s) {
      case 'COMPRA': return <ArrowUpCircle size={56} className="text-emerald-500" />;
      case 'VENDA': return <ArrowDownCircle size={56} className="text-rose-500" />;
      default: return <MinusCircle size={56} className="text-slate-500" />;
    }
  };

  const isAI = analysis?.provider === 'GEMINI';

  return (
    <div className="space-y-6">
      
      {/* AI Status Badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
          isAI 
            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
            : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
        }`}>
          {isAI ? <BrainCircuit size={12} /> : <ShieldAlert size={12} />}
          {isAI ? 'Análise de Fluxo (Gemini 3 Pro)' : 'Modo Contingência'}
        </div>
      </div>
      
      {/* Top Row: Signal & Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Signal Card */}
        <div className={`col-span-1 md:col-span-1 rounded-2xl p-6 border-2 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md ${getSignalColor(analysis!.signal)}`}>
          <div className="mb-4 transform hover:scale-110 transition-transform duration-300">
            {getSignalIcon(analysis!.signal)}
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-70">Direção do Fluxo</h2>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter">{analysis!.signal}</h1>
          
          <div className="w-full bg-slate-900/40 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${
                analysis!.signal === SignalType.COMPRA ? 'bg-emerald-500' : 
                analysis!.signal === SignalType.VENDA ? 'bg-rose-500' : 'bg-slate-500'
              }`}
              style={{ width: `${analysis!.confidence}%` }}
            />
          </div>
          <p className="text-xs font-mono font-bold opacity-80">{analysis!.confidence}% Força do Movimento</p>
        </div>

        {/* Technical Strategy Card (Calculated without Image) */}
        <div className="col-span-1 md:col-span-2 bg-slate-800 rounded-2xl p-0 border border-slate-700 shadow-lg flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900/50 p-4 border-b border-slate-700/50 flex items-center gap-2">
            <Radar className="text-indigo-400" size={18} />
            <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Estimativa Técnica (Baseada em Volatilidade)</h3>
            <span className="ml-auto text-xs text-slate-500">{analysis!.technicalOutlook}</span>
          </div>

          {/* Trade Setup Grid */}
          <div className="grid grid-cols-3 divide-x divide-slate-700/50 border-b border-slate-700/50">
            {/* Entry */}
            <div className="p-4 flex flex-col items-center justify-center text-center bg-indigo-500/5">
              <span className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1">
                <Crosshair size={10} /> Zona Sugerida
              </span>
              <span className="text-sm font-mono font-semibold text-indigo-100 leading-tight">
                {analysis!.entryZone}
              </span>
            </div>

            {/* Stop Loss */}
            <div className="p-4 flex flex-col items-center justify-center text-center bg-rose-500/5">
              <span className="text-[10px] uppercase font-bold text-rose-400 mb-1 flex items-center gap-1">
                <Shield size={10} /> Stop Volatilidade
              </span>
              <span className="text-sm font-mono font-semibold text-rose-100 leading-tight">
                {analysis!.stopLoss}
              </span>
            </div>

            {/* Take Profit */}
            <div className="p-4 flex flex-col items-center justify-center text-center bg-emerald-500/5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                <Target size={10} /> Alvo Estatístico
              </span>
              <span className="text-sm font-mono font-semibold text-emerald-100 leading-tight">
                {analysis!.takeProfit}
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 flex-1 flex flex-col gap-4">
             <div>
                <h4 className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                  <BrainCircuit size={12} /> Raciocínio Macro (Dados + Notícias)
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-slate-600 pl-3">
                  {analysis!.reasoning}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
          <h4 className="text-emerald-400 text-xs font-bold uppercase mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
            <ArrowUpCircle size={14} /> Fatores de Alta
          </h4>
          <ul className="space-y-3">
            {analysis!.positiveFactors.length > 0 ? (
              analysis!.positiveFactors.map((f, i) => (
                <li key={i} className="text-emerald-100/90 text-sm flex items-start gap-3 bg-emerald-500/5 p-2 rounded">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  {f}
                </li>
              ))
            ) : (
              <li className="text-slate-600 text-sm italic p-2">Sem drivers de alta claros.</li>
            )}
          </ul>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
          <h4 className="text-rose-400 text-xs font-bold uppercase mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
            <ArrowDownCircle size={14} /> Fatores de Baixa
          </h4>
          <ul className="space-y-3">
            {analysis!.negativeFactors.length > 0 ? (
              analysis!.negativeFactors.map((f, i) => (
                <li key={i} className="text-rose-100/90 text-sm flex items-start gap-3 bg-rose-500/5 p-2 rounded">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  {f}
                </li>
              ))
            ) : (
              <li className="text-slate-600 text-sm italic p-2">Sem drivers de baixa claros.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Actions (Reset) */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={onReset} 
          disabled={isLoading}
          className="text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Activity size={14} />
          Novo Rastreamento
        </button>
      </div>

    </div>
  );
};

export default PreSignalDisplay;