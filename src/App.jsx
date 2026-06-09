import React, { useState, lazy, Suspense } from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  ShieldCheck,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import logo from './assets/logo.png';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';

/* Heavy components load only when their tab is first visited */
const Dashboard        = lazy(() => import('./components/Dashboard'));
const InvoiceGenerator = lazy(() => import('./components/InvoiceGenerator'));
const ProposalBuilder  = lazy(() => import('./components/ProposalBuilder'));
const AdminPanel       = lazy(() => import('./components/AdminPanel'));

const TabSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', name: 'Invoices', icon: FileText },
  { id: 'proposals', name: 'Proposals', icon: Lightbulb },
  { id: 'admin', name: 'Admin', icon: ShieldCheck },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNav = (id) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/60 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex-shrink-0`}>
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.5)]">
               <img src={logo} alt="Vortiqaa Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-200">Vortiqaa</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Technologies</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group ${
                    isActive
                      ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/25 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-indigo-400' : ''} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-indigo-500" />}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                AD
              </div>
              <div>
                <p className="text-xs font-semibold">Admin</p>
                <p className="text-[10px] text-slate-500">vortiqaa.com</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200 text-sm"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-5 py-3.5 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
              <input
                type="text"
                placeholder="Search invoices, clients..."
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 w-60 transition-all placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">Vortiqaa Admin</p>
              <p className="text-[10px] text-slate-500 capitalize">{activeTab}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7 max-w-7xl w-full mx-auto">
          <Suspense fallback={<TabSpinner />}>
            {activeTab === 'dashboard'  && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'invoices'   && <InvoiceGenerator />}
            {activeTab === 'proposals'  && <ProposalBuilder />}
            {activeTab === 'admin'      && <AdminPanel />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
