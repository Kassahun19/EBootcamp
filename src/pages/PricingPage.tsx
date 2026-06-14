import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle, ArrowRight, Video, FileText, Upload, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PricingPage({
  onNavigate
}: {
  onNavigate: (page: string, params?: any) => void;
}) {
  const { user, token } = useAuth();
  
  // Receipt State
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('Commercial Bank of Ethiopia (CBE)');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Fetch student past payments on page load
  const fetchStudentPayments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        setPayments(list);
      }
    } catch (e) {
      console.error("Error loaded past student payments:", e);
    }
  };

  useEffect(() => {
    fetchStudentPayments();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.pdf'].includes(ext)) {
        setStatus({ type: 'error', message: 'Supported files are only PNG, JPG, or PDF formats.' });
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'File exceeds maximum 10MB limit.' });
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setStatus({ type: null, message: '' });
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'You must log in to upload payment paperwork.' });
      return;
    }
    if (!refNumber) {
      setStatus({ type: 'error', message: 'The transaction reference number represents a mandatory field.' });
      return;
    }
    if (!file) {
      setStatus({ type: 'error', message: 'Please attach the official bank screenshot, photo, or PDF receipt.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: null, message: '' });

      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('refNumber', refNumber);
      formData.append('notes', notes);
      formData.append('paymentAmount', paymentAmount);
      formData.append('paymentMethod', paymentMethod);

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          type: 'success',
          message: 'Manual receipt submitted! Admin will evaluate and activate PREMIUM access within 1-2 hours.'
        });
        setRefNumber('');
        setNotes('');
        setFile(null);
        fetchStudentPayments(); // Reload payment lists
      } else {
        setStatus({ type: 'error', message: data.message || 'Submission error occurred.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network communication failure during upload.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 py-12 px-4 md:py-16" id="pricing-full-page">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Course Core Pricing Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Invest in Your Future
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Lifetime Academic Premium Access
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Join thousands of Ethiopian students studying modern systems, fluent communication, and practical logic. Pay once and inherit lifetime software assets.
          </p>
        </div>

        {/* Pricing Offer Card + Receipt Submission Flex */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
          
          {/* Left Portion: Pricing Details Card */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-emerald-950 to-slate-950 text-white rounded-2xl p-8 border border-emerald-500/20 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-emerald-400 text-lg">PREMIUM LIFETIME</h3>
                  <span className="bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 font-bold px-3 py-0.5 rounded text-xs uppercase tracking-widest">
                    Best Academic Rate
                  </span>
                </div>

                <div className="py-4 border-y border-slate-800">
                  <span className="text-4xl md:text-5xl font-black text-emerald-400">ETB 1,000</span>
                  <span className="text-slate-400 text-xs font-medium ml-2">Legacy Rate</span>
                </div>

                <div className="space-y-4">
                  {[
                    "Lifetime Access to English, Mathematics, and AI Full-Stack Web Development programs.",
                    "Organized modules, lessons, and embedded YouTube videos with zero advertisement interruptions.",
                    "Assess progress with automated grading exams and pass/fail score tracking.",
                    "Direct homework submissions checked by regional computer science lecturers.",
                    "Downloadable verified certificates equipped with unique validation codes and QR links.",
                    "Future academic syllabus updates built for cloud technologies."
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-normal">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 space-y-3.5">
                  <a 
                    id="pricing_go_premium_href"
                    href="https://ye-buna.com/kassahunmulatu" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full inline-block text-center py-4 bg-emerald-500 hover:bg-emerald-400 transition text-slate-950 font-black rounded-lg text-sm md:text-base shadow-lg cursor-pointer transform hover:-translate-y-0.5"
                  >
                    GO PREMIUM
                  </a>
                  <p className="text-[11px] text-slate-400 text-center uppercase tracking-widest">
                    Safe financial redirect to **ye-buna.com/kassahunmulatu**
                  </p>
                </div>
              </div>
            </div>

            {/* Standard Bank instructions */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-md text-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-black text-slate-950 text-sm tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Official Wire Transfer & Mobile Bank Details
                </h4>
                <p className="text-slate-500 mt-1 font-semibold leading-relaxed">
                  Please make a transfer of <strong className="text-slate-900 font-bold">1,000 ETB</strong> to any of the verified institutional accounts listed below. Once transferred, take a screenshot or download the payment receipt PDF and upload it in the form to your right for immediate manual verification.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="bg-slate-50/50 p-2.5 rounded-lg text-slate-600 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">Account Holder Name</span>
                    <strong className="text-slate-900 font-black text-sm">Kassahun Mulatu Kebede</strong>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                    Verified Holder
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { bank: "Commercial Bank of Ethiopia (CBE)", number: "1000183217198" },
                    { bank: "Bank of Abyssinia (BOA)", number: "32419186" },
                    { bank: "Bunna Bank (BB)", number: "3609501002452" },
                    { bank: "Telebirr (Mobile Wallet)", number: "0915508167" }
                  ].map((acc, key) => (
                    <div key={key} className="p-3 border border-slate-150 rounded-xl hover:border-slate-300 transition duration-150 bg-white shadow-xs flex justify-between items-center group">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-emerald-500 transition-colors"></span>
                          {acc.bank}
                        </span>
                        <div className="font-mono text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded text-xs select-all inline-block border border-slate-100">
                          {acc.number}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(acc.number);
                          alert(`Copied ${acc.bank} account number: ${acc.number}`);
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-950 hover:text-white transition cursor-pointer"
                        title="Copy account number to clipboard"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-55/60 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-900 space-y-1 font-medium">
                <p className="font-black flex items-center gap-1.5 text-amber-950">
                  ⚡ Transaction Reference Prompt:
                </p>
                <p className="leading-relaxed">
                  Kindly specify <strong className="font-black text-slate-950">"Ezana Academy"</strong> or your registered student email address in the transaction reference/reason notes field during transfer. This helps us cross-reference and activate your legacy access instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Right Portion: Receipt Submission Form / Premium status */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            
            {user?.premium ? (
              <div className="bg-emerald-100 text-emerald-900 p-8 rounded-2xl border border-emerald-200 space-y-4 shadow-sm text-center">
                <ShieldCheck className="w-14 h-14 text-emerald-700 mx-auto" />
                <h3 className="text-2xl font-black text-slate-900">You Are Already a Premium Member!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your manual payment receipt was verified. You have lifetime access to English, Maths, and AI courses. Learn and download resources now!
                </p>
                <button
                  id="pricing_dashboard_redirect"
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs cursor-pointer inline-flex items-center gap-2 transition shadow"
                >
                  Enter Student Workspace <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : !token ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Manual Receipt Verification Workspace</h3>
                <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
                  Please log in or register a free student account first to submit your bank receipts, PDF documents, or transaction logs.
                </p>
                <div className="flex gap-4 justify-center pt-2">
                  <button
                    id="pricing_login_redirect"
                    onClick={() => onNavigate('login')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="pricing_register_redirect"
                    onClick={() => onNavigate('register')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded font-bold text-xs cursor-pointer"
                  >
                    Register Account
                  </button>
                </div>
              </div>
            ) : (
              /* Active Upload Receipt Workflow */
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-sky-500"></div>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white text-lg tracking-tight">Upload Bank Transfer Receipt</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-normal">
                    Submit the Commercial Bank of Ethiopia or Telebirr bank receipt document so our admin can verify it.
                  </p>
                </div>

                <form onSubmit={handleReceiptSubmit} className="space-y-5">
                  
                  {status.type && (
                    <div className={`p-4 rounded-xl text-xs leading-normal flex gap-2.5 border animate-fade-in ${
                      status.type === 'success' 
                        ? 'bg-emerald-55/60 text-emerald-900 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300' 
                        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300'
                    }`}>
                      {status.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
                      <span className="font-semibold">{status.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Payment Amount (ETB) *</label>
                      <input
                        id="pricing_amount_input"
                        type="number"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 focus:bg-white transition duration-200 font-extrabold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Payment Method *</label>
                      <select
                        id="pricing_method_input"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 focus:bg-white transition duration-200 font-black cursor-pointer"
                      >
                        <option>Commercial Bank of Ethiopia (CBE)</option>
                        <option>Bank of Abyssinia (BOA)</option>
                        <option>Bunna Bank (BB)</option>
                        <option>Telebirr Mobile Wallet</option>
                        <option>Ye-Buna Coffee Payment Link</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Transaction Reference (Txn ID / Ref) *</label>
                    <input
                      id="pricing_ref_input"
                      type="text"
                      required
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      placeholder="e.g. FT26101150047-CBE"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 focus:bg-white transition duration-200"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Attach Receipt File (PNG / JPG / PDF, Max 10MB) *</label>
                    
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700 transition duration-200 flex flex-col items-center justify-center relative cursor-pointer">
                      <input
                        id="pricing_file_upload"
                        type="file"
                        required
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2.5" />
                      <p className="text-slate-600 dark:text-slate-300 text-xs font-bold text-center">
                        {file ? `📎 Selected: ${file.name}` : "Drag and drop or Click to choose receipt file"}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 uppercase tracking-wide">Accepts images and PDF bills</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Additional Transaction Notes (Optional)</label>
                    <textarea
                      id="pricing_notes_input"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Specify your bank sender name or transaction timestamps..."
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 focus:bg-white transition duration-200 resize-none text-xs"
                    ></textarea>
                  </div>

                  <button
                    id="pricing_receipt_submit_btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-slate-950 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 space-x-2 text-white dark:text-slate-950 font-black transition rounded-xl text-xs uppercase tracking-widest shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Uploading Receipt Document..." : "Submit Receipt for Approval"}
                  </button>
                </form>

                {/* List student payment requests */}
                {payments.length > 0 && (
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-900 text-sm mb-3">Your Receipts History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payments.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-700">Ref: {p.refNumber}</p>
                            <p className="text-slate-400 text-[10px]">Submitted at: {new Date(p.createdAt).toLocaleDateString()}</p>
                            {p.reviewNotes && <p className="text-amber-700 text-[10px]">Review: {p.reviewNotes}</p>}
                            {p.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(p)}
                                className="text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline text-[10px] flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" /> View Official Invoice
                              </button>
                            )}
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* INVOICE MODAL VIEWER */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 text-slate-900 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Billing Records</h4>
                  <h3 className="font-black text-slate-900 text-base">Verified Academic Invoice</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Invoice Sheet */}
              <div className="p-8 space-y-6 text-xs flex-1">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-emerald-900 font-serif leading-none tracking-tight">EZANA ACADEMY</h5>
                    <p className="text-[10px] text-slate-400">Bahir Dar, Ethiopia</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                      Paid & Verified
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">Invoice NO: #{selectedInvoice.id || '987'}</p>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 font-sans">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Billed To</span>
                    <p className="font-extrabold text-slate-800">{user?.name || 'Academic Student'}</p>
                    <p className="text-slate-500 text-[10px]">{user?.email || 'student@ezana.academy'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Payment Date</span>
                    <p className="font-extrabold text-slate-800">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                    <p className="text-slate-500 text-[10px]">Reference: {selectedInvoice.refNumber}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Billing Details</span>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Ezana Academy Lifetime Premium Access Upgrade</span>
                      <span className="font-mono">{selectedInvoice.paymentAmount || '1000'} ETB</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Unblocks infinite academic lecture chapters, certified exams, and dynamic developer portfolio workspaces.
                    </p>
                  </div>
                </div>

                {/* Subtotal block */}
                <div className="border-t border-slate-100 pt-4 space-y-1.5 font-sans">
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Base Fee Pricing</span>
                    <span>{selectedInvoice.paymentAmount || '1000'} ETB</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Service Tax (VAT)</span>
                    <span>0.00 ETB (Waived)</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-slate-900 border-t border-slate-100 pt-2 text-sm">
                    <span>Total Paid Amount</span>
                    <span className="font-mono text-emerald-800">{selectedInvoice.paymentAmount || '1000'} ETB</span>
                  </div>
                </div>

                {/* Bank Transfer notes */}
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-[10px] leading-relaxed flex gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">Authorized Merchant Clearance</p>
                    <p className="opacity-85">Cleared via {selectedInvoice.paymentMethod}. Thank you for supporting indigenous tech education in Ethiopia!</p>
                  </div>
                </div>

              </div>

              {/* Footer with simulation Print button */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded uppercase tracking-wider cursor-pointer"
                >
                  Print Document
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-extrabold text-[11px] rounded uppercase tracking-wider cursor-pointer"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Dismiss
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
