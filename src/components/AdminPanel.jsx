import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Users, FileText, Lightbulb, Trash2, RefreshCw,
  CheckCircle, Clock, FileEdit, Settings, Database, Plus, X,
  UserPlus, Save, Building2, CreditCard, Eye, EyeOff
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, addDoc, serverTimestamp, setDoc
} from 'firebase/firestore';

const statusStyle = {
  Paid:    'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  Draft:   'bg-slate-500/15 text-slate-400',
  Sent:    'bg-blue-500/15 text-blue-400',
};

/* ─── Small helpers ─── */
const SectionTitle = ({ children }) => (
  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">{children}</p>
);

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-slate-500 uppercase">{label}</label>
    {children}
  </div>
);

const input = "w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all";

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
    <Icon size={16} />{label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
  const [tab, setTab]           = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showPw, setShowPw]     = useState(false);

  /* Admin-user form */
  const [adminForm, setAdminForm] = useState({
    name: '', email: '', phone: '', role: 'Manager', password: '', notes: ''
  });
  const setAF = (k, v) => setAdminForm(f => ({ ...f, [k]: v }));

  /* Company settings */
  const [company, setCompany] = useState({
    name: 'Vortiqaa Technologies', email: 'contact@vortiqaa.com',
    phone: '+91 98765 43210', address: '123 Tech Street, Bengaluru, Karnataka - 560001',
    gstin: '', website: 'www.vortiqaa.com',
    bankName: '', accountNumber: '', ifsc: '', upiId: '',
  });
  const setC = (k, v) => setCompany(c => ({ ...c, [k]: v }));

  /* ── Fetch helpers ── */
  const fetchInvoices = async () => {
    const snap = await getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')));
    setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const fetchProposals = async () => {
    const snap = await getDocs(query(collection(db, 'proposals'), orderBy('createdAt', 'desc')));
    setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const fetchAdmins = async () => {
    const snap = await getDocs(collection(db, 'admins'));
    setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([fetchInvoices(), fetchProposals(), fetchAdmins()]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Invoice status update ── */
  const updateInvoiceStatus = async (id, status) => {
    await updateDoc(doc(db, 'invoices', id), { status });
    setInvoices(inv => inv.map(i => i.id === id ? { ...i, status } : i));
  };

  /* ── Delete helpers ── */
  const del = (col, id, setter) => async () => {
    if (!window.confirm('Delete this record?')) return;
    await deleteDoc(doc(db, col, id));
    setter(list => list.filter(x => x.id !== id));
  };

  /* ── Add Admin User ── */
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email) return alert('Name and Email are required.');
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'admins'), {
        ...adminForm,
        createdAt: serverTimestamp(),
        active: true,
      });
      setAdmins(a => [...a, { id: ref.id, ...adminForm, active: true }]);
      setAdminForm({ name: '', email: '', phone: '', role: 'Manager', password: '', notes: '' });
      alert(`Admin "${adminForm.name}" created in Firestore!`);
    } catch (e) { console.error(e); alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  /* ── Save Company Settings ── */
  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'company'), { ...company, updatedAt: serverTimestamp() });
      alert('Company settings saved to Firebase!');
    } catch (e) { console.error(e); alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  /* ── Derived stats ── */
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
  const pendingAmt   = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="space-y-7 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck size={24} className="text-indigo-400" /> Admin Panel
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Manage your team, invoices, proposals and company settings — all synced with Firebase.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        <Tab active={tab==='overview'}  onClick={()=>setTab('overview')}  icon={Database} label="Overview" />
        <Tab active={tab==='admins'}    onClick={()=>setTab('admins')}    icon={UserPlus} label="Admin Users" />
        <Tab active={tab==='invoices'}  onClick={()=>setTab('invoices')}  icon={FileText} label="Invoices" />
        <Tab active={tab==='proposals'} onClick={()=>setTab('proposals')} icon={Lightbulb} label="Proposals" />
        <Tab active={tab==='company'}   onClick={()=>setTab('company')}   icon={Settings} label="Company Settings" />
        <button onClick={refresh} className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-2">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Total Invoices',   value: invoices.length,  icon: FileText,     color:'text-indigo-400', bg:'bg-indigo-500/10' },
              { label: 'Total Proposals',  value: proposals.length, icon: Lightbulb,    color:'text-amber-400',  bg:'bg-amber-500/10'  },
              { label: 'Revenue Collected',value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: CheckCircle, color:'text-emerald-400', bg:'bg-emerald-500/10' },
              { label: 'Pending Amount',   value: `₹${pendingAmt.toLocaleString('en-IN')}`,  icon: Clock,       color:'text-amber-400',  bg:'bg-amber-500/10'  },
              { label: 'Admin Users',      value: admins.length,    icon: Users,        color:'text-blue-400',   bg:'bg-blue-500/10'   },
              { label: 'Active Clients',   value: new Set(invoices.map(i=>i.clientName)).size, icon: Building2, color:'text-violet-400', bg:'bg-violet-500/10' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                <div className={`p-2.5 rounded-xl ${s.bg} w-fit mb-4`}><s.icon size={20} className={s.color} /></div>
                <p className="text-slate-400 text-xs font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Recent admin list snippet */}
          {admins.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="font-semibold mb-4">Admin Team ({admins.length})</p>
              <div className="flex flex-wrap gap-3">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{a.name}</p>
                      <p className="text-[10px] text-slate-500">{a.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ADMIN USER MANAGEMENT ═══ */}
      {tab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
          {/* Add Admin Form */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 self-start">
            <SectionTitle>Add New Admin User</SectionTitle>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <Field label="Full Name *">
                <input className={input} value={adminForm.name} onChange={e=>setAF('name',e.target.value)} placeholder="John Doe" required />
              </Field>
              <Field label="Email Address *">
                <input className={input} type="email" value={adminForm.email} onChange={e=>setAF('email',e.target.value)} placeholder="john@vortiqaa.com" required />
              </Field>
              <Field label="Phone Number">
                <input className={input} value={adminForm.phone} onChange={e=>setAF('phone',e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Role">
                <select className={input} value={adminForm.role} onChange={e=>setAF('role',e.target.value)}>
                  <option>Owner</option>
                  <option>Manager</option>
                  <option>Accountant</option>
                  <option>Sales Executive</option>
                  <option>Developer</option>
                  <option>Support</option>
                </select>
              </Field>
              <Field label="Temporary Password">
                <div className="relative">
                  <input className={input + ' pr-10'} type={showPw ? 'text' : 'password'}
                    value={adminForm.password} onChange={e=>setAF('password',e.target.value)} placeholder="••••••••" />
                  <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </Field>
              <Field label="Notes">
                <textarea className={input + ' resize-none'} rows={2} value={adminForm.notes} onChange={e=>setAF('notes',e.target.value)} placeholder="Optional notes..." />
              </Field>
              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-60">
                <UserPlus size={16}/>
                {saving ? 'Creating...' : 'Create Admin User'}
              </button>
            </form>
          </div>

          {/* Admin Users List */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden self-start">
            <div className="p-5 border-b border-white/5">
              <p className="font-semibold">Admin Users ({admins.length})</p>
            </div>
            {admins.length === 0 ? (
              <p className="p-8 text-center text-slate-500 text-sm">No admin users yet. Add your first one →</p>
            ) : (
              <div className="divide-y divide-white/5">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-800/60 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg font-medium">{a.role}</span>
                      <button onClick={del('admins', a.id, setAdmins)} className="text-slate-600 hover:text-rose-400 transition-colors">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ INVOICES ═══ */}
      {tab === 'invoices' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <p className="font-semibold">All Invoices ({invoices.length})</p>
          </div>
          {loading ? (
            <p className="p-8 text-center text-slate-500 text-sm">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">No invoices yet. Create one in the Invoices tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-600 text-[11px] uppercase tracking-wider">
                    {['Invoice #','Client','Project','Amount','Status','Actions'].map(h=>(
                      <th key={h} className="px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-indigo-400 text-xs whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">{inv.clientName}</td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{inv.projectType}</td>
                      <td className="px-5 py-3.5 font-semibold whitespace-nowrap">₹{(inv.total||0).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5">
                        <select value={inv.status} onChange={e=>updateInvoiceStatus(inv.id,e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer ${statusStyle[inv.status]||'bg-slate-500/15 text-slate-400'}`}>
                          {['Draft','Sent','Pending','Paid'].map(s=><option key={s} className="bg-slate-900 text-white">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={del('invoices',inv.id,setInvoices)} className="text-slate-600 hover:text-rose-400 transition-colors">
                          <Trash2 size={15}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ PROPOSALS ═══ */}
      {tab === 'proposals' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <p className="font-semibold">All Proposals ({proposals.length})</p>
          </div>
          {loading ? (
            <p className="p-8 text-center text-slate-500 text-sm">Loading...</p>
          ) : proposals.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">No proposals yet. Create one in the Proposals tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-600 text-[11px] uppercase tracking-wider">
                    {['Client','Project Name','Budget','Timeline','Features','Actions'].map(h=>(
                      <th key={h} className="px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{p.clientName}</td>
                      <td className="px-5 py-3.5 text-slate-400">{p.projectName||'—'}</td>
                      <td className="px-5 py-3.5 font-semibold">{p.estimatedBudget?`₹${p.estimatedBudget}`:'—'}</td>
                      <td className="px-5 py-3.5 text-slate-400">{p.timeline||'—'}</td>
                      <td className="px-5 py-3.5 text-slate-400">{p.features?.length||0}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={del('proposals',p.id,setProposals)} className="text-slate-600 hover:text-rose-400 transition-colors">
                          <Trash2 size={15}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ COMPANY SETTINGS ═══ */}
      {tab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <SectionTitle>Company Information</SectionTitle>
            {[
              {label:'Company Name',  key:'name'},
              {label:'Email',         key:'email'},
              {label:'Phone',         key:'phone'},
              {label:'Website',       key:'website'},
              {label:'GSTIN',         key:'gstin'},
            ].map(({label,key})=>(
              <Field key={key} label={label}>
                <input className={input} value={company[key]} onChange={e=>setC(key,e.target.value)} />
              </Field>
            ))}
            <Field label="Registered Address">
              <textarea className={input+' resize-none'} rows={2} value={company.address} onChange={e=>setC('address',e.target.value)} />
            </Field>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <SectionTitle>Bank & Payment Details</SectionTitle>
            {[
              {label:'Bank Name',      key:'bankName'},
              {label:'Account Number', key:'accountNumber'},
              {label:'IFSC Code',      key:'ifsc'},
              {label:'UPI ID',         key:'upiId'},
            ].map(({label,key})=>(
              <Field key={key} label={label}>
                <input className={input} value={company[key]} onChange={e=>setC(key,e.target.value)} />
              </Field>
            ))}

            <div className="mt-6 pt-4 border-t border-white/5 bg-indigo-500/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-indigo-400" />
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Firebase Status</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-slate-400">Connected to <span className="text-indigo-300 font-mono">vortiqaa</span> Firestore project</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button onClick={handleSaveCompany} disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60">
              <Save size={16}/> {saving ? 'Saving...' : 'Save to Firebase'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
