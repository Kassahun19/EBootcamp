import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquareCode, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ success: true, message: data.message || 'Support inquiry transmitted successfully!' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus({ success: false, message: data.message || 'Transmission failed.' });
      }
    } catch (err) {
      setStatus({ success: false, message: 'Network connection issue. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 py-12 px-4 transition-colors duration-200" id="contact_page_root">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 text-[10px] uppercase font-mono tracking-widest font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full">
            Help Desk & Advisors
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Connect With Our Academy
          </h2>
          <p className="text-slate-505 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
            Need guidance regarding course enrollments, manual receipt unlocks, or customized corporate lectures? Speak directly with our representatives.
          </p>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Left - Contact Coordinates */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-8 shadow-md border border-emerald-800/20 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Direct Support Channels</h3>
                <p className="text-emerald-200 text-xs leading-relaxed">
                  Call, email, or write directly to our central campus office located in Bahir Dar.
                </p>
              </div>

              {/* Direct coordinates details list */}
              <div className="space-y-6">
                <a 
                  href="tel:0915508167" 
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-emerald-950/50 hover:scale-102 transition duration-200 group text-left block"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300 group-hover:bg-emerald-500/30">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-350 uppercase tracking-widest">Call Mobile Hotline</p>
                    <p className="text-sm font-bold mt-0.5 group-hover:text-amber-400 transition font-mono">0915508167</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Primary voice call channel</p>
                  </div>
                </a>

                <a 
                  href="mailto:kassahunmulatu273@gmail.com" 
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-emerald-950/50 hover:scale-102 transition duration-200 group text-left block"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300 group-hover:bg-emerald-500/30">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-350 uppercase tracking-widest">Email Mailbox</p>
                    <p className="text-sm font-bold mt-0.5 group-hover:text-amber-400 transition font-mono border-b border-dashed border-emerald-500/30 pb-1">kassahunmulatu273@gmail.com</p>
                    <p className="text-[10px] text-emerald-350 font-mono mt-1">Backup: kmulatu21@gmail.com</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Academic questions response desk</p>
                  </div>
                </a>

                <div 
                  className="flex items-start gap-4 p-3 rounded-lg text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-350 uppercase tracking-widest">HQ Campus Address</p>
                    <p className="text-sm font-bold mt-0.5 font-mono">Bahir Dar, Ethiopia</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Central academic cluster</p>
                  </div>
                </div>
              </div>

              {/* Extra attractive card info */}
              <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-700/20 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-amber-450 font-bold">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-250 font-sans">Active Office Hours</span>
                </div>
                <p className="text-emerald-300 text-[11px] leading-relaxed">
                  Monday to Saturday: <span className="text-white font-semibold">8:00 AM – 6:00 PM</span> East Africa Time (EAT). Direct manual receipt validations processed round-the-clock.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3.5 shadow-sm text-xs">
              <span className="px-2 py-0.5 text-[9px] bg-sky-100 text-sky-800 font-bold rounded uppercase">Academy Registry</span>
              <h4 className="font-bold text-slate-900 dark:text-white">Reviewer Safeguards</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
                Upon hitting the send button, our server appends the ticket directly onto the admin dashboard message pool catalog without loss. Permanent local state architecture ensures message retention even during server updates.
              </p>
            </div>
          </div>

          {/* Column 2: Right - Premium Attractor Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 space-y-6 relative overflow-hidden" id="support-contact-card">
            {/* Corner absolute glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Submit Supported Message Desk</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Complete core inputs below to transmit message payloads safely.</p>
            </div>

            {status && (
              <div className={`p-4 rounded-xl flex items-center gap-3 border text-xs leading-relaxed animate-fade-in ${
                status.success 
                  ? 'bg-emerald-55/60 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300'
              }`}>
                {status.success ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <span className="text-lg">⚠️</span>}
                <p className="font-semibold">{status.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Samuel Mulatu"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:focus:bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-250 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. samuel@example.com"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:focus:bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-250 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0915508167"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:focus:bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-250 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Inquiry Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. manual payment validation code"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:focus:bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-250 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Detailed message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Draft your query details here..."
                  className="w-full p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:focus:bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-emerald-500 transition duration-250 text-xs leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-slate-950 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-950 font-black rounded-xl uppercase tracking-widest text-xs transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Transmitting payload...' : 'Transmit Supported Message'}
                <Send className="w-4 h-4" />
              </button>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
