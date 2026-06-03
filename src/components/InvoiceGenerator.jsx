import React, { useState, useRef } from 'react';
import { Plus, Trash2, Printer, Send, Download } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const TAX_RATE = 18; // GST %

const InvoiceGenerator = () => {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const printRef = useRef();

  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    projectType: 'Web Development',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    taxRate: TAX_RATE,
    notes: 'Thank you for choosing Vortiqaa Technologies. Payment is due within 15 days.',
    status: 'Draft',
  });

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addItem = () => setField('items', [...form.items, { description: '', quantity: 1, rate: 0 }]);
  const removeItem = i => setField('items', form.items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };
    setField('items', items);
  };

  const subtotal = form.items.reduce((s, it) => s + it.quantity * Number(it.rate), 0);
  const tax = (subtotal * form.taxRate) / 100;
  const total = subtotal + tax;

  const handleSave = async () => {
    if (!form.clientName) return alert('Please enter a client name.');
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'invoices'), {
        ...form,
        subtotal,
        tax,
        total,
        createdAt: serverTimestamp(),
      });
      setSavedId(ref.id);
      alert(`Invoice saved to Firebase! ID: ${ref.id}`);
    } catch (e) {
      console.error(e);
      alert('Firebase not configured yet. Fill in firebase.js with your credentials first.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-7 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice Generator</h2>
          <p className="text-slate-500 text-sm mt-0.5">Create and send professional invoices instantly.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Printer size={15} /> Print
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-60">
            <Send size={15} /> {saving ? 'Saving...' : 'Save to Firebase'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-7 items-start">
        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Invoice Meta */}
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Invoice Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Invoice #</label>
                <input value={form.invoiceNumber} onChange={e => setField('invoiceNumber', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Project Type</label>
                <select value={form.projectType} onChange={e => setField('projectType', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all">
                  <option>Web Development</option>
                  <option>Mobile App</option>
                  <option>E-Commerce</option>
                  <option>UI/UX Design</option>
                  <option>Software Consulting</option>
                  <option>API Integration</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Invoice Date</label>
                <input type="date" value={form.invoiceDate} onChange={e => setField('invoiceDate', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Client Name *', key: 'clientName', placeholder: 'Acme Corporation' },
                { label: 'Client Email', key: 'clientEmail', placeholder: 'client@example.com' },
                { label: 'Phone Number', key: 'clientPhone', placeholder: '+91 98765 43210' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">{label}</label>
                  <input value={form[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                </div>
              ))}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Client Address</label>
                <textarea rows={2} value={form.clientAddress} onChange={e => setField('clientAddress', e.target.value)}
                  placeholder="123 Business Street, City, State - 600001"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Line Items</h3>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-600 uppercase font-bold">Description</label>
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="e.g. Homepage Design"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="w-16 space-y-1">
                    <label className="text-[10px] text-slate-600 uppercase font-bold">Qty</label>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all text-center" />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] text-slate-600 uppercase font-bold">Rate (₹)</label>
                    <input type="number" min={0} value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="w-24 text-right pb-2">
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Amount</p>
                    <p className="text-sm font-semibold text-indigo-300">₹{(item.quantity * Number(item.rate)).toLocaleString('en-IN')}</p>
                  </div>
                  <button onClick={() => removeItem(i)} className="pb-2 text-slate-600 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-all text-sm">
                <Plus size={16} /> Add Line Item
              </button>
            </div>
          </div>

          {/* Tax & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">GST/Tax Rate (%)</label>
              <input type="number" value={form.taxRate} onChange={e => setField('taxRate', Number(e.target.value))}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all">
                <option>Draft</option>
                <option>Sent</option>
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Notes / Payment Terms</label>
            <textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none" />
          </div>
        </div>

        {/* Live Preview - printable */}
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-semibold">Live Preview</p>
            <span className="text-xs text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-lg">Auto-updates</span>
          </div>

          <div ref={printRef} id="invoice-print" className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header bar */}
            <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">V</div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Vortiqaa</p>
                  <p className="text-indigo-200 text-[10px] uppercase tracking-widest">Technologies</p>
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
                  {form.dueDate && <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                    <p className="text-sm font-semibold text-rose-600">{form.dueDate}</p>
                  </div>}
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
                  {form.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium">{it.description || '—'}</td>
                      <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-3 text-right text-slate-600">₹{Number(it.rate).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-bold">₹{(it.quantity * Number(it.rate)).toLocaleString('en-IN')}</td>
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
                    <span className="text-slate-500">GST ({form.taxRate}%)</span>
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
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes & Payment Terms</p>
                  <p className="text-xs text-slate-600">{form.notes}</p>
                </div>
              )}

              <div className="mt-8 text-center text-[9px] text-slate-400 uppercase tracking-[0.25em] font-bold">
                Vortiqaa Technologies · contact@vortiqaa.com · +91 XXX XXX XXXX
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceGenerator;
