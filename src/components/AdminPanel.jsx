import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, Users, FileText, Lightbulb, Trash2, RefreshCw,
  CheckCircle, Clock, FileEdit, Settings, Database, Plus, X,
  UserPlus, Save, Building2, CreditCard, Eye, EyeOff, Download,
  Printer, Send
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, addDoc, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';

const statusStyle = {
  Paid:    'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  Draft:   'bg-slate-500/15 text-slate-400',
  Sent:    'bg-blue-500/15 text-blue-400',
};

/* ── Vortiqaa Official Seal ── */
const VortiqaaSeal = () => (
  <svg width="88" height="88" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
    <circle cx="44" cy="44" r="41" fill="none" stroke="#4338ca" strokeWidth="2"/>
    <circle cx="44" cy="44" r="35" fill="none" stroke="#4338ca" strokeWidth="0.75"/>
    <circle cx="44" cy="44" r="26" fill="none" stroke="#4338ca" strokeWidth="0.75" strokeDasharray="2 2"/>
    {[...Array(24)].map((_, i) => {
      const a = (i / 24) * 2 * Math.PI;
      const big = i % 6 === 0;
      return (
        <line key={i}
          x1={44 + (big ? 35.5 : 36.5) * Math.cos(a)} y1={44 + (big ? 35.5 : 36.5) * Math.sin(a)}
          x2={44 + (big ? 40.5 : 39.5) * Math.cos(a)} y2={44 + (big ? 40.5 : 39.5) * Math.sin(a)}
          stroke="#4338ca" strokeWidth={big ? 2 : 1}/>
      );
    })}
    <text x="44" y="30" textAnchor="middle" fill="#4338ca" fontSize="6.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1.5">VORTIQAA</text>
    <text x="44" y="38" textAnchor="middle" fill="#4338ca" fontSize="5.8" fontWeight="600" fontFamily="Arial,sans-serif" letterSpacing="0.5">TECHNOLOGIES</text>
    <text x="44" y="55" textAnchor="middle" fill="#4338ca" fontSize="20" fontWeight="900" fontFamily="Arial,sans-serif">V</text>
    <text x="44" y="65" textAnchor="middle" fill="#4338ca" fontSize="5.8" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="3">VERIFIED</text>
  </svg>
);

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

const inp = "w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all";
const inpWhite = "w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-all";

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
    <Icon size={16} />{label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════ */
/* Invoice Edit Modal                                                  */
/* ═══════════════════════════════════════════════════════════════════ */
const InvoiceEditModal = ({ invoice, company, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...invoice });
  const [saving, setSaving]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activePane, setActivePane] = useState('edit'); // 'edit' | 'preview'

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addItem = () => setField('items', [...(form.items || []), { description: '', quantity: 1, rate: 0 }]);
  const removeItem = i => setField('items', form.items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };
    setField('items', items);
  };

  const subtotal = (form.items || []).reduce((s, it) => s + (it.quantity || 1) * Number(it.rate || 0), 0);
  const tax = (subtotal * (form.taxRate || 18)) / 100;
  const total = subtotal + tax;

  const handleSave = async () => {
    if (!form.clientName) return alert('Client name is required.');
    setSaving(true);
    try {
      await updateDoc(doc(db, 'invoices', invoice.id), {
        ...form,
        subtotal,
        tax,
        total,
        updatedAt: serverTimestamp(),
      });
      onSaved({ ...form, id: invoice.id, subtotal, tax, total });
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    /* Inject visibility-based print CSS so Electron's printToPDF captures
       only the invoice preview, regardless of modal nesting depth. */
    const style = document.createElement('style');
    style.id = '__modal-print-css';
    style.textContent = `@media print{body *{visibility:hidden!important}#edit-invoice-print,#edit-invoice-print *{visibility:visible!important}#edit-invoice-print{position:fixed!important;inset:0!important;width:100%!important;background:white!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}}`;
    document.head.appendChild(style);
    try {
      if (window.electronAPI?.savePDF) {
        const result = await window.electronAPI.savePDF(`${form.invoiceNumber || 'Invoice'}.pdf`);
        if (result.success) {
          alert(`PDF saved to Downloads:\n${result.path}`);
        } else if (!result.canceled) {
          alert('PDF save failed: ' + (result.error || 'Unknown'));
        }
      } else {
        window.print();
      }
    } catch (e) {
      console.error('PDF download error:', e);
      alert('PDF save failed.');
    } finally {
      document.getElementById('__modal-print-css')?.remove();
      setDownloading(false);
    }
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="flex flex-col w-full h-full overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/15 rounded-xl">
              <FileEdit size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-base">Edit Invoice</p>
              <p className="text-xs text-slate-500 font-mono">{form.invoiceNumber} · {form.clientName}</p>
            </div>
          </div>

          {/* Pane toggle (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setActivePane('edit')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activePane === 'edit' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
              Edit
            </button>
            <button onClick={() => setActivePane('preview')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activePane === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
              Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              <Download size={14} /> {downloading ? 'Saving…' : 'Download PDF'}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60">
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Two-pane body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Edit Form */}
          <div className={`flex-shrink-0 w-full lg:w-[480px] overflow-y-auto p-6 space-y-6 border-r border-white/8 ${activePane === 'preview' ? 'hidden lg:block' : 'block'}`}
            style={{ background: 'rgba(8,10,24,0.7)' }}>

            {/* Invoice Meta */}
            <div>
              <SectionTitle>Invoice Info</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Invoice #">
                  <input className={inp} value={form.invoiceNumber || ''} onChange={e => setField('invoiceNumber', e.target.value)} />
                </Field>
                <Field label="Project Type">
                  <select className={inp} value={form.projectType || 'Web Development'} onChange={e => setField('projectType', e.target.value)}>
                    <option>Web Development</option>
                    <option>Mobile App</option>
                    <option>E-Commerce</option>
                    <option>UI/UX Design</option>
                    <option>Software Consulting</option>
                    <option>API Integration</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Invoice Date">
                  <input type="date" className={inp} value={form.invoiceDate || ''} onChange={e => setField('invoiceDate', e.target.value)} />
                </Field>
                <Field label="Due Date">
                  <input type="date" className={inp} value={form.dueDate || ''} onChange={e => setField('dueDate', e.target.value)} />
                </Field>
                <Field label="Status">
                  <select className={inp} value={form.status || 'Draft'} onChange={e => setField('status', e.target.value)}>
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Pending</option>
                    <option>Paid</option>
                  </select>
                </Field>
                <Field label="GST/Tax (%)">
                  <input type="number" className={inp} value={form.taxRate ?? 18} onChange={e => setField('taxRate', Number(e.target.value))} />
                </Field>
              </div>
            </div>

            {/* Client Details */}
            <div>
              <SectionTitle>Client Details</SectionTitle>
              <div className="space-y-3">
                <Field label="Client Name *">
                  <input className={inp} value={form.clientName || ''} onChange={e => setField('clientName', e.target.value)} placeholder="Acme Corp" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email">
                    <input className={inp} value={form.clientEmail || ''} onChange={e => setField('clientEmail', e.target.value)} placeholder="client@example.com" />
                  </Field>
                  <Field label="Phone">
                    <input className={inp} value={form.clientPhone || ''} onChange={e => setField('clientPhone', e.target.value)} placeholder="+91 98765 43210" />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea rows={2} className={inp + ' resize-none'} value={form.clientAddress || ''} onChange={e => setField('clientAddress', e.target.value)} placeholder="123 Business Street, City" />
                </Field>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <SectionTitle>Line Items</SectionTitle>
              <div className="space-y-3">
                {(form.items || []).map((item, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-slate-600 uppercase font-bold">Description</label>
                      <input value={item.description || ''} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="e.g. Homepage Design"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="w-14 space-y-1">
                      <label className="text-[10px] text-slate-600 uppercase font-bold">Qty</label>
                      <input type="number" min={1} value={item.quantity || 1} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all text-center" />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] text-slate-600 uppercase font-bold">Rate (₹)</label>
                      <input type="number" min={0} value={item.rate || 0} onChange={e => updateItem(i, 'rate', e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="w-20 text-right pb-2">
                      <p className="text-[10px] text-slate-600 uppercase font-bold">Amount</p>
                      <p className="text-sm font-semibold text-indigo-300">₹{((item.quantity || 1) * Number(item.rate || 0)).toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={() => removeItem(i)} className="pb-2 text-slate-600 hover:text-rose-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-all text-sm">
                  <Plus size={15} /> Add Line Item
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">GST ({form.taxRate ?? 18}%)</span>
                <span className="font-medium">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-bold">Total</span>
                <span className="font-black text-xl text-indigo-400">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <SectionTitle>Notes / Payment Terms</SectionTitle>
              <textarea rows={3} className={inp + ' resize-none'} value={form.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="Payment is due within 15 days..." />
            </div>
          </div>

          {/* RIGHT — Live Preview */}
          <div className={`flex-1 overflow-y-auto p-6 ${activePane === 'edit' ? 'hidden lg:block' : 'block'}`}
            style={{ background: 'rgba(4,8,20,0.6)' }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm font-semibold">Live Preview</p>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">Auto-updates as you edit</span>
            </div>

            {/* Invoice Document */}
            <div id="edit-invoice-print" className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
              {/* Header bar */}
              <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {company.logoBase64 ? (
                    <img src={company.logoBase64} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
                  ) : (
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {company.name ? company.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{company.name}</p>
                    {company.gstin && <p className="text-indigo-200 text-[10px] uppercase tracking-widest">GSTIN: {company.gstin}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-xs uppercase tracking-widest">Invoice</p>
                  <p className="text-white font-bold text-base">{form.invoiceNumber}</p>
                </div>
              </div>

              <div className="p-8">
                {/* Meta row */}
                <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billed To</p>
                    <p className="font-bold text-base">{form.clientName || 'Client Name'}</p>
                    {form.clientEmail && <p className="text-xs text-slate-500">{form.clientEmail}</p>}
                    {form.clientPhone && <p className="text-xs text-slate-500">{form.clientPhone}</p>}
                    {form.clientAddress && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{form.clientAddress}</p>}
                  </div>
                  <div className="text-right space-y-1.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project</p>
                      <p className="text-sm font-semibold text-indigo-700">{form.projectType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Date</p>
                      <p className="text-sm">{form.invoiceDate}</p>
                    </div>
                    {form.dueDate && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                        <p className="text-sm font-semibold text-rose-600">{form.dueDate}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                      <p className={`text-xs font-bold inline-block px-2 py-0.5 rounded-lg ${
                        form.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        form.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        form.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{form.status}</p>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <table className="w-full mb-8 text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-2 text-left">Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(form.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="py-3 font-medium">{it.description || '—'}</td>
                        <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                        <td className="py-3 text-right text-slate-600">₹{Number(it.rate || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-bold">₹{((it.quantity || 1) * Number(it.rate || 0)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-60 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">GST ({form.taxRate ?? 18}%)</span>
                      <span className="font-medium">₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                      <span className="font-bold text-base">Total</span>
                      <span className="font-black text-xl text-indigo-700">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {form.notes && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes & Payment Terms</p>
                    <p className="text-xs text-slate-600">{form.notes}</p>
                  </div>
                )}

                {/* Terms */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Terms & Conditions</p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1 font-medium">
                    <li>Maintenance of the app or website costs as per the features.</li>
                    <li>Technical issues faced in the app will be fixed for free.</li>
                    <li>Dedicated customer service and implementation of new ideas are included.</li>
                  </ul>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-bold">
                    {company.name} · {company.email} · {company.phone}
                  </div>
                  <VortiqaaSeal />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
  const [tab, setTab]           = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [dlLoading, setDlLoading] = useState(false);

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
    bankName: '', accountNumber: '', ifsc: '', upiId: '', logoBase64: ''
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

  const fetchCompanySettings = async () => {
    const docSnap = await getDoc(doc(db, 'settings', 'company'));
    if (docSnap.exists()) {
      setCompany(prev => ({ ...prev, ...docSnap.data() }));
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([fetchInvoices(), fetchProposals(), fetchAdmins(), fetchCompanySettings()]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Download invoice PDF directly from table row ── */
  useEffect(() => {
    if (!downloadingInvoice) return;
    setDlLoading(true);

    // React has painted the portal into the DOM by now; give the browser one
    // tick to finish layout before printToPDF captures the page.
    const timer = setTimeout(async () => {
      const style = document.createElement('style');
      style.id = '__row-print-css';
      style.textContent = `@media print{body *{visibility:hidden!important}[data-vq-print],[data-vq-print] *{visibility:visible!important}[data-vq-print]{position:fixed!important;inset:0!important;width:100%!important;background:white!important}}`;
      document.head.appendChild(style);
      try {
        if (window.electronAPI?.savePDF) {
          const result = await window.electronAPI.savePDF(
            `${downloadingInvoice.invoiceNumber || 'Invoice'}.pdf`
          );
          if (result.success) {
            alert(`PDF saved to Downloads:\n${result.path}`);
          } else if (!result.canceled) {
            alert('PDF save failed: ' + (result.error || 'Unknown'));
          }
        } else {
          window.print();
        }
      } catch (e) {
        console.error('Row PDF error:', e);
        alert('PDF save failed.');
      } finally {
        document.getElementById('__row-print-css')?.remove();
        setDownloadingInvoice(null);
        setDlLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [downloadingInvoice]);

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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setC('logoBase64', reader.result);
      reader.readAsDataURL(file);
    }
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
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 self-start">
            <SectionTitle>Add New Admin User</SectionTitle>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <Field label="Full Name *">
                <input className={inp} value={adminForm.name} onChange={e=>setAF('name',e.target.value)} placeholder="John Doe" required />
              </Field>
              <Field label="Email Address *">
                <input className={inp} type="email" value={adminForm.email} onChange={e=>setAF('email',e.target.value)} placeholder="john@vortiqaa.com" required />
              </Field>
              <Field label="Phone Number">
                <input className={inp} value={adminForm.phone} onChange={e=>setAF('phone',e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Role">
                <select className={inp} value={adminForm.role} onChange={e=>setAF('role',e.target.value)}>
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
                  <input className={inp + ' pr-10'} type={showPw ? 'text' : 'password'}
                    value={adminForm.password} onChange={e=>setAF('password',e.target.value)} placeholder="••••••••" />
                  <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </Field>
              <Field label="Notes">
                <textarea className={inp + ' resize-none'} rows={2} value={adminForm.notes} onChange={e=>setAF('notes',e.target.value)} placeholder="Optional notes..." />
              </Field>
              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-60">
                <UserPlus size={16}/>
                {saving ? 'Creating...' : 'Create Admin User'}
              </button>
            </form>
          </div>

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
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <p className="font-semibold">All Invoices ({invoices.length})</p>
            <p className="text-xs text-slate-500">Click <FileEdit size={11} className="inline" /> to edit any invoice</p>
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
                    <tr key={inv.id} className="hover:bg-white/3 transition-colors group">
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingInvoice(inv)}
                            title="Edit Invoice"
                            className="flex items-center gap-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 px-2 py-1 rounded-lg transition-all text-xs font-medium">
                            <FileEdit size={14}/> Edit
                          </button>
                          <button
                            onClick={() => !dlLoading && setDownloadingInvoice(inv)}
                            title="Download PDF"
                            disabled={dlLoading && downloadingInvoice?.id === inv.id}
                            className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-all text-xs font-medium disabled:opacity-50">
                            <Download size={14}/> {dlLoading && downloadingInvoice?.id === inv.id ? '…' : 'PDF'}
                          </button>
                          <button onClick={del('invoices',inv.id,setInvoices)} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
                            <Trash2 size={14}/>
                          </button>
                        </div>
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
            <Field label="Company Logo">
              <div className="flex items-center gap-4">
                {company.logoBase64 && <img src={company.logoBase64} alt="Logo" className="w-12 h-12 object-contain bg-white/10 rounded-xl" />}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
              </div>
            </Field>
            {[
              {label:'Company Name',  key:'name'},
              {label:'Email',         key:'email'},
              {label:'Phone',         key:'phone'},
              {label:'Website',       key:'website'},
              {label:'GSTIN',         key:'gstin'},
            ].map(({label,key})=>(
              <Field key={key} label={label}>
                <input className={inp} value={company[key]} onChange={e=>setC(key,e.target.value)} />
              </Field>
            ))}
            <Field label="Registered Address">
              <textarea className={inp+' resize-none'} rows={2} value={company.address} onChange={e=>setC('address',e.target.value)} />
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
                <input className={inp} value={company[key]} onChange={e=>setC(key,e.target.value)} />
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

      {/* ═══ PORTAL INVOICE RENDER FOR DIRECT PDF DOWNLOAD ═══
          Rendered into document.body so the visibility print CSS works. ═══ */}
      {downloadingInvoice && createPortal((() => {
        const inv = downloadingInvoice;
        const items = inv.items || [];
        const sub = items.reduce((s, it) => s + (it.quantity || 1) * Number(it.rate || 0), 0);
        const tx  = (sub * (inv.taxRate ?? 18)) / 100;
        const tot = sub + tx;
        return (
          /* Off-screen in normal view; printToPDF reveals it via visibility CSS */
          <div data-vq-print="1" style={{ position: 'fixed', top: '-9999vh', left: 0, width: '850px', background: 'white' }}>
            <div className="bg-white text-slate-900 overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {company.logoBase64
                    ? <img src={company.logoBase64} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1"/>
                    : <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">{company.name ? company.name.charAt(0) : 'V'}</div>}
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{company.name}</p>
                    {company.gstin && <p className="text-indigo-200 text-[10px] uppercase tracking-widest">GSTIN: {company.gstin}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-xs uppercase tracking-widest">Invoice</p>
                  <p className="text-white font-bold text-base">{inv.invoiceNumber}</p>
                </div>
              </div>
              <div className="p-8">
                {/* Billed To / Meta */}
                <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billed To</p>
                    <p className="font-bold text-base">{inv.clientName}</p>
                    {inv.clientEmail && <p className="text-xs text-slate-500">{inv.clientEmail}</p>}
                    {inv.clientPhone && <p className="text-xs text-slate-500">{inv.clientPhone}</p>}
                    {inv.clientAddress && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{inv.clientAddress}</p>}
                  </div>
                  <div className="text-right space-y-1.5">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project</p><p className="text-sm font-semibold text-indigo-700">{inv.projectType}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Date</p><p className="text-sm">{inv.invoiceDate}</p></div>
                    {inv.dueDate && <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p><p className="text-sm font-semibold text-rose-600">{inv.dueDate}</p></div>}
                  </div>
                </div>
                {/* Items Table */}
                <table className="w-full mb-8 text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-2 text-left">Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-3 font-medium">{it.description || '—'}</td>
                        <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                        <td className="py-3 text-right text-slate-600">₹{Number(it.rate || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-bold">₹{((it.quantity || 1) * Number(it.rate || 0)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-60 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹{sub.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">GST ({inv.taxRate ?? 18}%)</span><span className="font-medium">₹{tx.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900"><span className="font-bold text-base">Total</span><span className="font-black text-xl text-indigo-700">₹{tot.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
                {inv.notes && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes & Payment Terms</p>
                    <p className="text-xs text-slate-600">{inv.notes}</p>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Terms & Conditions</p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1 font-medium">
                    <li>Maintenance of the app or website costs as per the features.</li>
                    <li>Technical issues faced in the app will be fixed for free.</li>
                    <li>Dedicated customer service and implementation of new ideas are included.</li>
                  </ul>
                </div>
                {/* Footer + Seal */}
                <div className="flex items-end justify-between mt-2">
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.25em] font-bold">{company.name} · {company.email} · {company.phone}</p>
                  <VortiqaaSeal />
                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ═══ INVOICE EDIT MODAL ═══ */}
      {editingInvoice && (
        <InvoiceEditModal
          invoice={editingInvoice}
          company={company}
          onClose={() => setEditingInvoice(null)}
          onSaved={(updated) => {
            setInvoices(list => list.map(i => i.id === updated.id ? updated : i));
          }}
        />
      )}
    </div>
  );
};

export default AdminPanel;
