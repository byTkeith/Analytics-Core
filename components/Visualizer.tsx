
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { AnalysisResult } from '../types';

const COLORS = ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#064e3b'];

interface Props {
  result?: AnalysisResult;
}

const Visualizer: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 italic">
        System idling... awaiting query.
      </div>
    );
  }

  const { chartData, chartType, columns, summary } = result;

  const handlePrint = () => {
    window.print();
  };

  const renderChart = () => {
    if (!chartData || !chartData.length) return null;
    const nameX = columns?.[0] || 'Category';
    const nameY = columns?.[1] || 'Metric';

    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" name={nameY} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" name={nameY} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={120} label>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" name={nameY} stroke="#059669" fill="#d1fae5" />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 chart-container">
      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Executive Insight</h3>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Verified Analysis</span>
            </div>
          </div>
          
          <button 
            onClick={handlePrint}
            className="no-print p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100 flex items-center space-x-2 text-xs font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v7" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed font-medium text-lg mb-8 italic border-l-4 border-slate-100 pl-4 py-2">
            "{summary}"
          </p>
        </div>

        {chartData && chartData.length > 0 && (
          <div className="h-[450px] w-full bg-slate-50/30 p-4 rounded-2xl border border-dashed border-slate-200 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart() || <div className="flex items-center justify-center h-full text-slate-400">Visualization Engine Error</div>}
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Analytical Reasoning</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-100">
            {result.reasoning}
          </p>
        </div>
      </div>
      
      <div className="print-only hidden text-center text-[10px] text-slate-400 mt-10">
        Generated by O'GradysCore AI - Legacy Ingestion Engine
      </div>
    </div>
  );
};

export default Visualizer;
