import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, Clock, XCircle, AlertCircle, Copy, Download } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ACCOUNT_DETAILS: Record<string, string> = {
  'BCA': '8640680416',
  'BRI': '017201085210500',
  'BLU BCA': '006980006709',
  'SUPERBANK': '000003499084',
  'JAGO': '105063618131',
  'GOPAY': '083110723422',
  'DANA': '082228350934'
};

export default function PaymentPage() {
  const { id } = useParams();
  const [tx, setTx] = useState<any>(null);

  const [copiedType, setCopiedType] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qris-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Create padded canvas for better scanning
    const paddedCanvas = document.createElement('canvas');
    const padding = 20;
    paddedCanvas.width = canvas.width + (padding * 2);
    paddedCanvas.height = canvas.height + (padding * 2);
    
    const ctx = paddedCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
      ctx.drawImage(canvas, padding, padding);
    }
    
    const pngUrl = paddedCanvas.toDataURL('image/png');
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QRIS-${tx.id.substring(0, 8)}.png`;
    downloadLink.click();
  };

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

          {/* Payment Method Details */}
          {tx.status === 'PENDING' && (
            <div className="flex flex-col items-center w-full">
              {(!tx.payment_method || tx.payment_method === 'QRIS') ? (
                <>
                  {tx.qris_payload ? (
                    <div className="flex flex-col items-center">
                      <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl inline-block relative">
                        <QRCodeCanvas id="qris-canvas" value={tx.qris_payload} size={224} level="M" includeMargin={false} />
                      </div>
                      <button 
                        onClick={downloadQR}
                        className="mt-4 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm w-full"
                      >
                        <Download size={16} /> Download QR Code
                      </button>
                    </div>
                  ) : (
                    <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-2xl" />
                  )}
                  <p className="text-sm text-slate-500 mt-5 text-center font-medium">Scan this QR code using your mobile banking or e-wallet app.</p>
                </>
              ) : (
                <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-left">
                  <h3 className="font-bold text-slate-900 mb-4 text-center border-b border-slate-100 pb-4 font-display uppercase tracking-wider text-sm">Bank Transfer</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Bank</span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{tx.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg select-all">
                          {ACCOUNT_DETAILS[tx.payment_method] || '-'}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(ACCOUNT_DETAILS[tx.payment_method] || '', 'account')}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center"
                          title="Copy Account Number"
                        >
                          {copiedType === 'account' ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Account Name</span>
                      <span className="font-bold text-slate-900 uppercase">Feri</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Transfer Amount</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg select-all">
                          {formatRupiah(tx.total_amount)}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(tx.total_amount.toString(), 'amount')}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center"
                          title="Copy Transfer Amount"
                        >
                          {copiedType === 'amount' ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-6 text-center font-medium bg-slate-50 py-2 rounded-lg border border-slate-100">
                    Use the exact details above to complete your transfer.
                  </p>
                </div>
              )}
              
              <div className="w-full mt-6">
                <a 
                  href={`https://wa.me/6283110723422?text=${encodeURIComponent(`Halo Feri, berikut adalah bukti pembayaran saya:\n\nBase Amount: Rp ${tx.base_amount?.toLocaleString('id-ID')}\nUnique Code: +${tx.unique_code}\n*Total Transfer: Rp ${tx.total_amount?.toLocaleString('id-ID')}*\n\nMetode Pembayaran: ${tx.payment_method}`)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Kirim Bukti via WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
