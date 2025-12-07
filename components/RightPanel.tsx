
import React from 'react';
import { MoreVertical, ArrowUpRight, ArrowDownLeft, QrCode, TrendingUp, Clock, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Tooltip } from './Tooltip';

const data = [
  { name: 'Mo', val: 400 },
  { name: 'Tu', val: 300 },
  { name: 'We', val: 550 },
  { name: 'Th', val: 450 },
  { name: 'Fr', val: 600 },
  { name: 'Sa', val: 500 },
  { name: 'Su', val: 700 },
];

export const RightPanel: React.FC = () => {
  return (
    <div className="w-[320px] h-full flex flex-col border-l border-slate-100 bg-white/50 backdrop-blur-sm pt-6 px-6 pb-6 hidden lg:flex">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                    <img src="https://picsum.photos/100/100" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <span className="text-sm font-bold text-slate-800 block">Reon Ucst</span>
                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md">@reon_u</span>
            </div>
        </div>
        <Tooltip content="Account Options" position="left">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                <MoreVertical size={16} />
            </button>
        </Tooltip>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Quick Actions */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="flex justify-between gap-2">
                <QuickAction icon={<ArrowUpRight size={20} />} label="Send" color="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                <QuickAction icon={<ArrowDownLeft size={20} />} label="Receive" color="bg-teal-50 text-teal-600 hover:bg-teal-100" />
                <QuickAction icon={<QrCode size={20} />} label="Scan" color="bg-slate-50 text-slate-600 hover:bg-slate-100" />
            </div>
        </div>

        {/* Dashboard Chart */}
        <div>
            <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics</h3>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">
                     <TrendingUp size={10} /> +12.5%
                 </div>
            </div>
            
            <div className="h-40 w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-50 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Volume</p>
                        <p className="text-lg font-bold text-slate-800">$12.4k</p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B8D85" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3B8D85" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="val" stroke="#3B8D85" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Recent Transactions */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
            <div className="space-y-3">
                <TransactionItem 
                    icon={<ArrowUpRight size={14} />} 
                    title="Sent SUI" 
                    subtitle="To Alex" 
                    amount="-150 SUI" 
                    time="2m ago"
                    type="sent"
                />
                <TransactionItem 
                    icon={<ArrowDownLeft size={14} />} 
                    title="Received USDC" 
                    subtitle="From Coinbase" 
                    amount="+500 USDC" 
                    time="1h ago"
                    type="received"
                />
                <TransactionItem 
                    icon={<ShieldCheck size={14} />} 
                    title="Minted NFT" 
                    subtitle="Cosmic Fox" 
                    amount="Gas: 0.01" 
                    time="1d ago"
                    type="neutral"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; color: string }> = ({ icon, label, color }) => (
    <Tooltip content={`Quickly ${label.toLowerCase()} assets`}>
        <button className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all ${color} group`}>
            <div className="mb-1 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    </Tooltip>
);

const TransactionItem: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; amount: string; time: string; type: 'sent' | 'received' | 'neutral' }> = ({ icon, title, subtitle, amount, time, type }) => {
    const bgColors = {
        sent: 'bg-slate-100 text-slate-600',
        received: 'bg-green-50 text-green-600',
        neutral: 'bg-indigo-50 text-indigo-600'
    };

    return (
        <Tooltip content="View transaction details" position="left">
            <button className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group text-left">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColors[type]}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{title}</p>
                        <p className="text-[10px] text-slate-400">{subtitle}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xs font-bold ${type === 'received' ? 'text-green-600' : 'text-slate-700'}`}>{amount}</p>
                    <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400">
                        <Clock size={8} /> {time}
                    </div>
                </div>
            </button>
        </Tooltip>
    );
}
