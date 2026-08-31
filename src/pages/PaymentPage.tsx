import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PaymentPage() {
  const { id } = useParams();
  const [tx, setTx] = useState<any>(null);

  // Real-time listener for Firestore
  useEffect(() => {
    if (!id) return;
    
    const unsub = onSnapshot(doc(db, 'transactions', id), (docSnap) => {
      if (docSnap.exists()) {
        setTx({ id: docSnap.id, ...docSnap.data() });
      }
    });

    return () => unsub();
  }, [id]);

  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 font-sans selection:bg-slate-200">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="text-center p-8 border-b border-slate-100">
          <h1 className="text-2xl font-display font-bold text-slate-900">Complete Payment</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Transaction ID: <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 ml-1">{tx.id.split('-')[0]}</span></p>
        </div>

        {/* Status Banner */}
        {tx.status === 'PAID' && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center justify-center space-x-2 text-emerald-700">
            <CheckCircle size={20} />
            <span className="font-medium">Payment Successful</span>
          </div>
        )}
        {tx.status === 'REJECTED' && (
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-center space-x-2 text-red-700">
            <XCircle size={20} />
            <span className="font-medium">Payment Rejected. Please contact support.</span>
          </div>
        )}
        {tx.status === 'PENDING' && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-center space-x-2 text-amber-700">
            <Clock size={20} />
            <span className="font-medium">Awaiting Payment</span>
          </div>
        )}

        <div className="p-8 space-y-8">
          {/* Amount Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex justify-between text-sm mb-3 text-slate-600 font-medium">
              <span>Base Amount</span>
              <span className="text-slate-900">{formatRupiah(tx.base_amount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 text-slate-600 font-medium">
              <span>Unique Code</span>
              <span className="font-mono font-bold text-slate-900">+{tx.unique_code}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 border-dashed flex justify-between items-center">
              <span className="font-semibold text-slate-900">Total Transfer</span>
              <span className="text-2xl font-bold font-display text-slate-900">{formatRupiah(tx.total_amount)}</span>
            </div>
            <p className="text-[11px] text-center text-amber-600 mt-4 flex items-center justify-center gap-1.5 font-medium bg-amber-50 py-2 rounded-lg">
              <AlertCircle size={14} /> Please transfer exact amount up to the last 3 digits
            </p>
          </div>

          {/* QR Code */}
          {tx.status === 'PENDING' && (
            <div className="flex flex-col items-center">
              {tx.qris_payload ? (
                <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl inline-block">
                  <QRCodeSVG value={tx.qris_payload} size={224} level="M" includeMargin={false} />
                </div>
              ) : (
                <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-2xl" />
              )}
              <p className="text-sm text-slate-500 mt-5 text-center font-medium">Scan this QR code using your mobile banking or e-wallet app.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
