
import React from 'react';
import { PreMarketAnalysis } from '../types';
import { Sun, Sunrise, Globe, CalendarClock, Briefcase, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, BarChart2, History } from 'lucide-react';

interface PreMarketDisplayProps {
  report: PreMarketAnalysis | null;
  isLoading: boolean;
  onGenerate: () => void;
}

const PreMarketDisplay: React.FC<PreMarketDisplayProps> = ({ report, isLoading, onGenerate }) => {
  
  if (!report && !isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-8 md:p-12 border border-slate-700/50 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="bg-amber-500/20 p-4 rounded-full mb-6">
          <Sunrise className="w-12 h-12 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Morning Call Estratégico</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          Gere o relatório de abertura baseado nos 5 pilares: Agenda, Fluxo Gringo, Correlacionados, Contexto de Ontem e Horários de Volatilidade.
        </p>
        <button 
          onClick={onGenerate}
          className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex items-center gap-3"
        >
          <Sun size={24} />
          Gerar Análise Pré-Mercado
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
        <div className="relative mb-6">
          <Globe className="text-blue-500 animate-spin-slow" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
             <Sunrise className="text-amber-500" size={24} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-200">Investigando os 5 Pilares...</h3>
        <p className="text-slate-400 text-sm mt-2">1. Pesquisando Agenda Global & Payroll...</p>
        <p className="text-slate-500 text-xs mt-1">2. Verificando Saldo de Estrangeiros na B3...</p>
        <p className="text-slate-500 text-xs mt-1">3. Cruzando dados de EWZ, S&P e DXY...</p>
      </div>
    );
  }

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'BULLISH': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'BEARISH': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header Card: Sentimento & Viés */}
      <div className={`p-6 rounded-2xl border ${getSentimentColor(report!.globalSentiment)} shadow-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sunrise size={20} />
            <h2 className="font-bold text-lg uppercase tracking-wide">Viés de Abertura</h2>
          </div>
          <span className="text-xs font-mono opacity-70">
            {new Date(report!.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">
          {report!.globalSentiment === 'BULLISH' ? 'OTIMISTA (Alta)' : report!.globalSentiment === 'BEARISH' ? 'PESSIMISTA (Baixa)' : 'MISTO / NEUTRO'}
        </h1>
        <p className="text-sm opacity-90 leading-relaxed font-medium">
          {report!.openingBias}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Agenda de Volatilidade (CRÍTICO) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="text-slate-200 font-bold text-sm uppercase">Horários de Perigo (Volatilidade)</h3>
          </div>
          <div className="p-4 flex-1">
             <div className="space-y-3">
               {report!.volatilitySchedule.length > 0 ? (
                 report!.volatilitySchedule.map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                     <div className="flex items-center gap-3">
                       <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded text-xs">{item.time}</span>
                       <div>
                         <p className="text-slate-200 text-xs font-bold">{item.event}</p>
                         <p className="text-slate-500 text-[10px]">{item.action}</p>
                       </div>
                     </div>
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                       item.impact === 'ALTO' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                     }`}>
                       {item.impact}
                     </span>
                   </div>
                 ))
               ) : (
                 <p className="text-slate-500 text-sm italic">Sem eventos críticos previstos para a manhã.</p>
               )}
             </div>
          </div>
        </div>

        {/* 3. Fluxo & Contexto */}
        <div className="space-y-4">
           
           {/* Fluxo Gringo */}
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h3 className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
               <Users size={14} /> Fluxo Estrangeiro (Ontem)
             </h3>
             <p className="text-slate-200 text-sm leading-snug border-l-2 border-blue-500 pl-3">
               {report!.foreignFlow}
             </p>
           </div>

           {/* Contexto Técnico */}
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h3 className="text-purple-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
               <History size={14} /> Contexto de Ontem
             </h3>
             <p className="text-slate-200 text-sm leading-snug border-l-2 border-purple-500 pl-3">
               {report!.yesterdayContext}
             </p>
           </div>
           
        </div>

      </div>

      {/* 4. Correlacionados (Snapshot) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-emerald-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
          <BarChart2 size={14} /> Correlacionados (Pré-Mercado Agora)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">S&P / Nasdaq</span>
            <span className="text-slate-200 text-xs font-medium">{report!.correlations.sp500}</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">EWZ (Brasil)</span>
            <span className="text-slate-200 text-xs font-medium">{report!.correlations.ewz}</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">DXY (Dólar)</span>
            <span className="text-slate-200 text-xs font-medium">{report!.correlations.dxy}</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Treasuries</span>
            <span className="text-slate-200 text-xs font-medium">{report!.correlations.treasuries}</span>
          </div>
        </div>
      </div>

      {/* 5. Conclusão Final */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-5 rounded-xl border border-slate-700 border-l-4 border-l-amber-500">
         <h3 className="text-amber-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
           <Briefcase size={14} /> Plano de Jogo (Resumo)
         </h3>
         <p className="text-slate-100 text-sm font-medium leading-relaxed">
           {report!.strategyPlan}
         </p>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={onGenerate}
          className="text-slate-500 hover:text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <Sun size={14} /> Atualizar Morning Call
        </button>
      </div>
    </div>
  );
};

export default PreMarketDisplay;
