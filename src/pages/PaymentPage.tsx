import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !id) return;
    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // compress dimension
          let scaleSize = 1;
          
          if (img.width > MAX_WIDTH) {
            scaleSize = MAX_WIDTH / img.width;
          }
          
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Generate compressed base64 string
          const base64String = canvas.toDataURL('image/jpeg', 0.6);

          try {
            await updateDoc(doc(db, 'transactions', id), {
              proof_image_path: base64String // Keep property name compatible
            });
          } catch (err: any) {
            setUploadError(err.message || 'An error occurred during upload');
          } finally {
            setUploading(false);
          }
        };
        img.onerror = () => {
          setUploadError('Failed to load image for compression');
          setUploading(false);
        };
        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };
      
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred');
      setUploading(false);
    }
  };

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

          {/* Upload Proof */}
          {tx.status === 'PENDING' && (
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4 font-display uppercase tracking-wider">Upload Proof</h3>
              
              {tx.proof_image_path ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="text-slate-900 mx-auto mb-3" size={28} />
                  <p className="text-sm text-slate-900 font-bold">Proof Uploaded</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Waiting for manual verification by Admin...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadError && <p className="text-red-600 text-xs font-medium bg-red-50 p-2 rounded-lg">{uploadError}</p>}
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform border border-slate-100">
                        <Upload className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="mb-1 text-sm text-slate-700 font-bold">Click to upload image</p>
                      <p className="text-xs text-slate-500 font-medium">PNG, JPG up to 5MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  </label>
                  
                  {file && (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-sm font-medium truncate text-slate-700 max-w-[180px] pl-2">{file.name}</span>
                      <button 
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-slate-900 text-white font-medium text-xs px-5 py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        {uploading ? 'Uploading...' : 'Upload Now'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
