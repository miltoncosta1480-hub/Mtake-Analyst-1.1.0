
import React, { useState, useRef } from 'react';
import { PostEntryAnalysis } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown, ImagePlus, X, Zap, Target, ArrowRight } from 'lucide-react';

interface PostEntryDisplayProps {
  analysis: PostEntryAnalysis | null;
  isLoading: boolean;
  onAnalyze: (direction: 'COMPRA' | 'VENDA', image: string) => void;
  onReset: () => void;
}

const PostEntryDisplay: React.FC<PostEntryDisplayProps> = ({ analysis, isLoading, onAnalyze, onReset }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [direction, setDirection] = useState<'COMPRA' | 'VENDA' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStart = () => {
    if (selectedImage && direction) {
      onAnalyze(direction, selectedImage);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
        <div className="relative mb-6">
           <ShieldCheck className="text-purple-500 animate-pulse" size={64} />
           <div className="absolute inset-0 flex items-center justify-center">
             <Zap className="text-white" size={24} />
           </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-200">Risk Manager Analisando...</h3>
        <p className="text-slate-400 text-sm mt-2">Cruzando Linha Amarela (Entrada) com Fluxo Macro...</p>
        <p className="text-slate-500 text-xs mt-1">Verificando canais de Volatilidade (Linhas Laranjas)...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 flex flex-col items-center">
        <div className="bg-purple-500/20 p-4 rounded-full mb-4">
          <ShieldCheck className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Gestão de Trade Ativo</h2>
        <p className="text-slate-400 text-sm text-center mb-6 max-w-md">
          Envie o print da operação. A IA identificará a <strong className="text-amber-400">Linha Amarela (Entrada)</strong>, <strong className="text-emerald-400">Verde (Stop/Gain)</strong> e <strong className="text-orange-400">Laranja (Volatilidade Aires)</strong>.
        </p>

        {/* Passo 1: Imagem */}
        <div className="w-full max-w-sm mb-6">
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-purple-500 hover:bg-slate-700/30 rounded-xl p-8 cursor-pointer flex flex-col items-center gap-2 group transition-all"
            >
              <ImagePlus className="text-slate-500 group-hover:text-purple-400" size={32} />
              <span className="text-sm font-semibold text-slate-400">Anexar Print da Operação</span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-purple-500/50">
              <img src={selectedImage} alt="Trade" className="w-full h-40 object-cover opacity-80" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded-full text-white hover:bg-rose-500">
                <X size={14} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>

        {/* Passo 2: Direção */}
        {selectedImage && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setDirection('COMPRA')}
              className={`px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 border transition-all ${
                direction === 'COMPRA' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500'
              }`}
            >
              <TrendingUp size={16} /> ESTOU COMPRADO
            </button>
            <button
              onClick={() => setDirection('VENDA')}
              className={`px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 border transition-all ${
                direction === 'VENDA' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-rose-500'
              }`}
            >
              <TrendingDown size={16} /> ESTOU VENDIDO
            </button>
          </div>
        )}

        {/* Botão Analisar */}
        <button 
          onClick={handleStart}
          disabled={!selectedImage || !direction}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
        >
          <Zap size={18} /> Analisar Trade
        </button>
      </div>
    );
  }

  // RESULTADO DA ANÁLISE
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'SAUDÁVEL': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
      case 'ALERTA': return 'bg-amber-500/10 border-amber-500/50 text-amber-400';
      case 'CRÍTICO': return 'bg-rose-500/10 border-rose-500/50 text-rose-400';
      default: return 'bg-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Status Card */}
      <div className={`rounded-2xl p-6 border-2 flex items-center justify-between ${getStatusColor(analysis.tradeStatus)}`}>
        <div className="flex items-center gap-4">
          {analysis.tradeStatus === 'SAUDÁVEL' ? <ShieldCheck size={48} /> : analysis.tradeStatus === 'ALERTA' ? <AlertTriangle size={48} /> : <AlertOctagon size={48} />}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-70">Saúde do Trade</h2>
            <h1 className="text-3xl font-black tracking-tight">{analysis.tradeStatus}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase opacity-70 mb-1">Score</p>
          <div className="text-4xl font-mono font-bold">{analysis.score}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recomendação */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Target size={100} />
          </div>
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Recomendação do Risk Manager</h3>
          <div className="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <ArrowRight size={24} className="text-purple-500" />
            {analysis.actionRecommendation}
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
            <h4 className="text-purple-400 text-[10px] font-bold uppercase mb-1">Sugestão Tática</h4>
            <p className="text-slate-200 text-sm font-medium">{analysis.adjustmentSuggestion}</p>
          </div>
        </div>

        {/* Análise Macro & Visual */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-3">Análise Cruzada (Macro + Visual)</h3>
          
          <div className="flex items-center gap-3 mb-4">
             <span className="text-xs text-slate-500">Alinhamento Macro:</span>
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
               analysis.macroAlignment === 'A FAVOR' ? 'bg-emerald-500/20 text-emerald-400' : 
               analysis.macroAlignment === 'CONTRA' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-600 text-slate-300'
             }`}>
               {analysis.macroAlignment}
             </span>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-purple-500 pl-3">
            {analysis.analysisText}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={onReset} className="text-slate-500 hover:text-purple-400 text-xs font-bold uppercase flex items-center gap-2">
           <Zap size={14} /> Nova Gestão
        </button>
      </div>

    </div>
  );
};

export default PostEntryDisplay;
