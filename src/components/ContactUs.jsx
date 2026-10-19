import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ContactUs() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Your message has been sent! Our team will get back to you shortly.');
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb / Back */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs mb-6 cursor-pointer transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block mb-2">
            Get in Touch
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Contact Selinmap Support
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Have questions about posting listings, upgrading to Golden Pin, or verifying your broker profile? Our Sri Lankan team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Details Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2.5">
                Direct Channels
              </h3>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Email Support</span>
                  <a href="mailto:support@selinmap.com" className="font-bold text-gray-800 hover:text-emerald-600 transition-colors">
                    support@selinmap.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Helpline & WhatsApp</span>
                  <a href="tel:+94112345678" className="font-bold text-gray-800 hover:text-blue-600 transition-colors">
                    +94 11 234 5678
                  </a>
                  <span className="text-[10px] text-gray-400 block mt-0.5">+94 77 123 4567 (WhatsApp)</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Headquarters</span>
                  <p className="font-bold text-gray-800 leading-snug">
                    Level 14, West Tower,<br />World Trade Center, Colombo 01, Sri Lanka
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Operating Hours</span>
                  <p className="font-bold text-gray-800">
                    Mon - Sat: 8:30 AM - 6:00 PM<br />
                    <span className="text-gray-400 font-normal">Sunday: Closed (Golden Pin verification active)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Note Card */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50/60 rounded-2xl p-4 border border-amber-200 text-xs">
              <span className="font-black text-amber-950 flex items-center gap-1.5 mb-1">
                <span>⭐</span>
                <span>Golden Pin Inquiries</span>
              </span>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Bank transfer slip verifications take between <strong>2 to 4 hours</strong> during working hours. For urgent listings, reach out on WhatsApp with your Listing ID.
              </p>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Thank You for Reaching Out!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto mb-5">
                  Your inquiry has been received. Our support team will review your message and reply to <strong className="text-gray-800">{formData.email}</strong> within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-1">
                  <MessageSquare size={16} className="text-emerald-600" />
                  <span>Send us a Message</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kasun Silva"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. kasun@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs bg-white cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Golden Pin Verification">Golden Pin Payment Verification</option>
                      <option value="Broker Badge Verification">Broker Badge Verification</option>
                      <option value="Report an Ad">Report a Fraudulent Ad</option>
                      <option value="Technical Support">Technical Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about your query or include your listing link/ID..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{loading ? 'Sending message...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
