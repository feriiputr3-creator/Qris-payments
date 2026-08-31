import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Store, User, Phone, DollarSign } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateDynamicQRIS } from '../lib/qris';

const STATIC_QRIS = "00020101021126570011ID.DANA.WWW011893600915384510518202098451051820303UMI51440014ID.CO.QRIS.WWW0215ID10254051145350303UMI5204541153033605802ID5910FERY 24JAM6015Kab. Bojonegoro61056215463046EFC";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', contact: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseAmount = parseInt(formData.amount, 10);
      if (isNaN(baseAmount) || baseAmount < 1000) {
        throw new Error('Minimal nominal adalah 1000 IDR');
      }

      // Generate unique code max 200
      const uniqueCode = Math.floor(Math.random() * 200) + 1;
      const totalAmount = baseAmount + uniqueCode;

      // Generate dynamic QRIS
      const dynamicQris = generateDynamicQRIS(STATIC_QRIS, totalAmount);

      // Save to firestore
      const docRef = await addDoc(collection(db, 'transactions'), {
        customer_name: formData.name,
        contact: formData.contact,
        base_amount: baseAmount,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        qris_payload: dynamicQris,
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
        </div>
        
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
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
              <label className="text-sm font-semibold text-slate-700">WhatsApp / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all outline-none"
                  placeholder="08123456789"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
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
                  min="1000"
                  required
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all outline-none"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Minimum amount is Rp1.000</p>
            </div>

            <div className="pt-2">
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
