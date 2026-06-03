import React, { useState } from 'react';
import { Plus, Trash2, Lightbulb, Zap, Layers, Shield, Smile, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ICONS = {
  Zap: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  Layers: { icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  Shield: { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Smile: { icon: Smile, color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

const ProposalBuilder = () => {
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState({
    clientName: '',
    clientEmail: '',
    projectName: '',
    pitchSummary: '',
    estimatedBudget: '',
    timeline: '',
    features: [
      { id: '1', title: 'Real-time Analytics', description: 'Monitor user behaviour as it happens with live dashboards.', icon: 'Zap' },
      { id: '2', title: 'Advanced Security', description: 'Multi-layer authentication and data encryption at rest.', icon: 'Shield' },
    ],
  });

  const setField = (key, val) => setProposal(p => ({ ...p, [key]: val }));

  const addFeature = () => setField('features', [...proposal.features, {
    id: Math.random().toString(36).slice(2), title: '', description: '', icon: 'Layers'
  }]);

  const removeFeature = id => setField('features', proposal.features.filter(f => f.id !== id));
  const updateFeature = (id, key, val) => setField('features', proposal.features.map(f => f.id === id ? { ...f, [key]: val } : f));

  const handleSave = async () => {
    if (!proposal.clientName) return alert('Please enter a client name.');
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'proposals'), {
        ...proposal,
        createdAt: serverTimestamp(),
        status: 'Sent',
      });
      alert(`Proposal saved to Firebase! ID: ${ref.id}`);
    } catch (e) {
      console.error(e);
      alert('Firebase not configured yet. Fill in firebase.js with your credentials first.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proposal Builder</h2>
          <p className="text-slate-500 text-sm mt-0.5">Pitch new features and project ideas to your clients.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60">
          <Send size={15} /> {saving ? 'Saving...' : 'Save Proposal'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">
        {/* Editor */}
        <div className="space-y-5">
          {/* Proposal Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Proposal Details</h3>
            {[
              { label: 'Client Name *', key: 'clientName', placeholder: 'Acme Corporation' },
              { label: 'Client Email', key: 'clientEmail', placeholder: 'client@example.com' },
              { label: 'Project Name', key: 'projectName', placeholder: 'e.g. Customer Portal v2' },
              { label: 'Estimated Budget (₹)', key: 'estimatedBudget', placeholder: 'e.g. 1,50,000' },
              { label: 'Timeline', key: 'timeline', placeholder: 'e.g. 6–8 weeks' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">{label}</label>
                <input value={proposal[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Pitch Summary</label>
              <textarea rows={3} value={proposal.pitchSummary} onChange={e => setField('pitchSummary', e.target.value)}
                placeholder="Why these features will drive more value for the client..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none" />
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Proposed Features</h3>
              <button onClick={addFeature} className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Plus size={14} /> Add Feature
              </button>
            </div>
            {proposal.features.map(feat => {
              const IconData = ICONS[feat.icon];
              const FeatureIcon = IconData?.icon;
              return (
                <div key={feat.id} className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3 relative group">
                  <button onClick={() => removeFeature(feat.id)} className="absolute top-3 right-3 text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Title</label>
                      <input value={feat.title} onChange={e => updateFeature(feat.id, 'title', e.target.value)} placeholder="Feature Name"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Icon Theme</label>
                      <select value={feat.icon} onChange={e => updateFeature(feat.id, 'icon', e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all">
                        <option value="Zap">⚡ Performance</option>
                        <option value="Layers">📦 Infrastructure</option>
                        <option value="Shield">🛡 Security</option>
                        <option value="Smile">😊 Experience</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Description</label>
                    <textarea rows={2} value={feat.description} onChange={e => updateFeature(feat.id, 'description', e.target.value)}
                      placeholder="Describe the value this feature adds..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Presentation Preview */}
        <div className="sticky top-24 bg-gradient-to-br from-indigo-950/80 to-slate-950 border border-indigo-500/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lightbulb size={28} className="text-indigo-400" />
          </div>
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">Upgrade Proposal</p>
          <div className="w-10 h-0.5 bg-indigo-500 rounded mx-auto mb-6"></div>

          <h3 className="text-2xl font-bold mb-3 leading-tight">
            {proposal.projectName || 'New Features'} for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-300">
              {proposal.clientName || '[Client]'}
            </span>
          </h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            {proposal.pitchSummary || 'Strategic enhancements to drive growth and efficiency.'}
          </p>

          {proposal.estimatedBudget && (
            <div className="bg-white/5 rounded-xl py-3 px-6 mb-8 inline-block">
              <p className="text-xs text-slate-500">Estimated Budget</p>
              <p className="text-lg font-bold text-indigo-300">₹{proposal.estimatedBudget}</p>
              {proposal.timeline && <p className="text-xs text-slate-500">{proposal.timeline}</p>}
            </div>
          )}

          <div className="space-y-4 text-left">
            {proposal.features.map(feat => {
              const IconData = ICONS[feat.icon] || ICONS.Layers;
              const FeatureIcon = IconData.icon;
              return (
                <div key={feat.id} className={`flex items-start gap-4 p-4 rounded-xl ${IconData.bg} border border-white/5`}>
                  <div className={`p-2 rounded-lg bg-white/5 ${IconData.color} flex-shrink-0`}>
                    <FeatureIcon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{feat.title || 'Feature'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{feat.description || 'Description'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all">
            Approve This Proposal →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalBuilder;
