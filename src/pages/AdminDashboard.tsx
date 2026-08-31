import React, { useEffect, useState } from 'react';
import { Search, Filter, Check, X, LogOut, FileImage, ShieldCheck, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const email = 'admin@elc.com'; // Default admin email
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If user not found, create it (lazy setup for prototyping)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
           await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr: any) {
           setLoginError('Invalid credentials');
        }
      } else {
        setLoginError('Invalid credentials');
      }
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    let q = query(collection(db, 'transactions'), orderBy('created_at', 'desc'));
    
    if (filter !== 'ALL') {
      q = query(collection(db, 'transactions'), where('status', '==', filter), orderBy('created_at', 'desc'));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const txs: any[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsub();
  }, [user, filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        status: newStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-slate-200">
        <div className="max-w-sm w-full bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Admin Access</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Enter your credentials to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <p className="text-red-600 text-sm font-medium text-center bg-red-50 py-3 rounded-xl border border-red-100">{loginError}</p>}
            <input
              type="password"
              placeholder="Admin Password"
              className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3.5 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all placeholder-slate-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div className="pt-2">
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-slate-900/10 focus:ring-4 focus:ring-slate-200">
                Secure Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-slate-200">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Transaction Dashboard</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Manage and verify QRIS payments</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              className="bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 text-sm transition-all"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Table */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider text-[11px] font-bold font-display border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">ID / Date</th>
                  <th className="px-6 py-5">Customer</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Proof</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      {loading ? 'Loading transactions...' : 'No transactions found.'}
                    </td>
                  </tr>
                )}
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-mono text-xs font-semibold text-slate-900 mb-1">{tx.id.split('-')[0]}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{new Date(tx.created_at + 'Z').toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-900">
                      {tx.customer_name}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold font-display text-slate-900">{formatRupiah(tx.total_amount)}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-1">Code: +{tx.unique_code}</div>
                    </td>
                    <td className="px-6 py-5">
                      {tx.proof_image_path ? (
                        <a href={tx.proof_image_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors">
                          <FileImage size={14} /> View
                        </a>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-medium border border-slate-100 border-dashed">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase
                        ${tx.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          tx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-100' : 
                          'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {tx.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => updateStatus(tx.id, 'PAID')}
                            className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-transform hover:scale-105 shadow-sm shadow-emerald-500/20"
                            title="Approve"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => updateStatus(tx.id, 'REJECTED')}
                            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-transform hover:scale-105 shadow-sm shadow-red-500/20"
                            title="Reject"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Log Component */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col h-[700px]">
          <h2 className="text-lg font-bold font-display text-slate-900 mb-8 flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Activity size={18} />
            </div>
            Activity Log
          </h2>
          <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
            {transactions.length === 0 && (
              <div className="text-center text-sm text-slate-500 font-medium mt-10">No activity to show.</div>
            )}
            {transactions.map((tx, idx) => (
              <div key={`log-${tx.id}`} className="relative flex gap-5 group">
                {/* Timeline Line */}
                {idx !== transactions.length - 1 && (
                  <div className="absolute top-8 left-[11px] bottom-[-32px] w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                )}
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 bg-white">
                  {tx.status === 'PAID' ? (
                    <CheckCircle size={24} className="text-emerald-500 bg-white" />
                  ) : tx.status === 'REJECTED' ? (
                    <XCircle size={24} className="text-red-500 bg-white" />
                  ) : (
                    <Clock size={24} className="text-amber-500 bg-white" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-1 pt-0.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      {tx.customer_name}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(tx.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-2.5">
                    {tx.status === 'PENDING' ? 'Submitted a payment of' : tx.status === 'PAID' ? 'Payment verified for' : 'Payment rejected for'} <span className="font-bold font-display text-slate-900">{formatRupiah(tx.total_amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${
                      tx.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      tx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">ID: {tx.id.split('-')[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
