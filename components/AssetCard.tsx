
import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  // Segurança contra dados undefined
  const price = typeof asset.price === 'number' ? asset.price : 0;
  const changePercent = typeof asset.changePercent === 'number' ? asset.changePercent : 0;

  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  const isNeutral = changePercent === 0;

  return (
    <div className="bg-slate-800 rounded-lg p-3 flex flex-col justify-between border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{asset.symbol}</h3>
          <p className="text-slate-300 text-xs truncate w-24" title={asset.name}>{asset.name}</p>
        </div>
        <div className={`flex items-center space-x-1 ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
          {isPositive && <TrendingUp size={16} />}
          {isNegative && <TrendingDown size={16} />}
          {isNeutral && <Minus size={16} />}
        </div>
      </div>
      
      <div className="flex justify-between items-baseline">
        <span className="text-slate-100 font-mono font-medium">
          {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-500'}`}>
          {isPositive ? '+' : ''}{changePercent}%
        </span>
      </div>
    </div>
  );
};

export default AssetCard;
