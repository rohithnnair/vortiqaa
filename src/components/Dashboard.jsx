import React from 'react';
import { TrendingUp, Users, FileCheck, Clock, ArrowUpRight, Plus } from 'lucide-react';

const stats = [
  { name: 'Total Revenue', value: '₹0', icon: TrendingUp, trend: '+0%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { name: 'Active Clients', value: '0', icon: Users, trend: '+0', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Invoices Paid', value: '0', icon: FileCheck, trend: '+0', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { name: 'Pending Proposals', value: '0', icon: Clock, trend: '0', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

const recentInvoices = [
  { id: 'INV-001', client: 'Acme Corp', project: 'Web App', amount: '₹42,000', status: 'Paid', date: 'Jun 1, 2026' },
  { id: 'INV-002', client: 'Nexus Systems', project: 'Mobile App', amount: '₹18,000', status: 'Pending', date: 'Jun 2, 2026' },
  { id: 'INV-003', client: 'Global Tech', project: 'E-Commerce', amount: '₹35,000', status: 'Paid', date: 'Jun 3, 2026' },
  { id: 'INV-004', client: 'Nova Labs', project: 'Landing Page', amount: '₹9,500', status: 'Draft', date: 'Jun 3, 2026' },
];

const statusStyle = {
  Paid: 'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  Draft: 'bg-slate-500/15 text-slate-400',
};

const Dashboard = ({ setActiveTab }) => {
  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">Vortiqaa Technologies — June 2026</p>
        </div>
        <button
          onClick={() => setActiveTab('invoices')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
        >
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">{stat.name}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold">Recent Invoices</h3>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium" onClick={() => setActiveTab('invoices')}>
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-600 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-indigo-400 text-xs">{inv.id}</td>
                    <td className="px-5 py-3.5 font-medium">{inv.client}</td>
                    <td className="px-5 py-3.5 font-semibold">{inv.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusStyle[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue bar chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col">
          <h3 className="font-semibold mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-500 mb-5">Last 7 months</p>
          <div className="flex-1 flex items-end gap-2">
            {[35, 55, 40, 75, 60, 85, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                <div
                  className="w-full rounded-t-lg bg-indigo-600/40 hover:bg-indigo-500/60 transition-colors cursor-default"
                  style={{ height: `${h}%`, minHeight: 8, maxHeight: 120 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">This month</p>
              <p className="text-lg font-bold text-emerald-400">+24%</p>
            </div>
            <button onClick={() => setActiveTab('admin')} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Full report <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
