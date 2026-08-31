import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Store, User, Phone, DollarSign, CreditCard, QrCode, Wallet, Smartphone } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateDynamicQRIS } from '../lib/qris';

const STATIC_QRIS = "00020101021126570011ID.DANA.WWW011893600915384510518202098451051820303UMI51440014ID.CO.QRIS.WWW0215ID10254051145350303UMI5204541153033605802ID5910FERY 24JAM6015Kab. Bojonegoro61056215463046EFC";

const PAYMENT_METHODS = [
  { id: 'QRIS', label: 'QRIS', icon: QrCode, color: 'text-pink-600', bg: 'bg-pink-100' },
  { id: 'BCA', label: 'BCA', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'BRI', label: 'BRI', icon: CreditCard, color: 'text-blue-800', bg: 'bg-blue-100' },
  { id: 'BLU BCA', label: 'Blu by BCA', icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { id: 'SUPERBANK', label: 'Superbank', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'JAGO', label: 'Jago', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'GOPAY', label: 'GoPay', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'DANA', label: 'DANA', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-100' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', amount: '' });
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseAmount = parseInt(formData.amount, 10);
      if (isNaN(baseAmount) || baseAmount < 10000) {
        throw new Error('Minimal nominal adalah 10.000 IDR');
      }

      // Generate unique code max 100 for QRIS, max 200 for others
      const maxUniqueCode = paymentMethod === 'QRIS' ? 100 : 200;
      const uniqueCode = Math.floor(Math.random() * maxUniqueCode) + 1;
      const totalAmount = baseAmount + uniqueCode;

      // Generate dynamic QRIS
      const dynamicQris = generateDynamicQRIS(STATIC_QRIS, totalAmount);

      // Save to firestore
      const docRef = await addDoc(collection(db, 'transactions'), {
        customer_name: formData.name,
        base_amount: baseAmount,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        qris_payload: dynamicQris,
        payment_method: paymentMethod,
        status: 'PENDING',
        proof_image_path: null,
        created_at: serverTimestamp(),
      });

      navigate(`/payment/${docRef.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-slate-200">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Store size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">Takeaway elc<br/>payment gateaway</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Seamless secure transactions</p>
          <a href="https://wa.me/6283110723422" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 mt-5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            WhatsApp Kami
          </a>
        </div>
        
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all outline-none"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Amount (IDR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  min="10000"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all outline-none"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Minimum amount is Rp10.000</p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-slate-700">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${method.bg}`}>
                        <Icon size={16} className={method.color} />
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-all focus:ring-4 focus:ring-slate-200 disabled:opacity-70 flex items-center justify-center shadow-md shadow-slate-900/10"
              >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Pay Now'
              )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
