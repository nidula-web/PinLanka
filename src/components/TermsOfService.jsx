import { ArrowLeft, BookOpen, AlertOctagon, CheckCircle2, DollarSign, Scale, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

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

        {/* Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xs space-y-8 text-gray-700">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block mb-2">
              User Agreement
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Effective date: October 2024 • Sellinmap Interactive Classifieds Platform
            </p>
          </div>

          {/* Section 1: Acceptance */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-600" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              By accessing, browsing, registering on, or posting listings to <strong>Sellinmap</strong> (&ldquo;the Platform&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you disagree with any part of these terms, you must refrain from using the platform.
            </p>
          </section>

          {/* Section 2: User Accounts */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              <span>2. Accounts & Accurate Representation</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Users must provide accurate, current, and truthful details during registration and ad creation. Brokers and agents must designate their seller type appropriately as &ldquo;Broker&rdquo; and obtain official broker verification badges where applicable. You are solely responsible for safeguarding your login credentials.
            </p>
          </section>

          {/* Section 3: Listing Guidelines */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <AlertOctagon size={18} className="text-rose-600" />
              <span>3. Listing Rules & Prohibited Content</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              When creating listings on Sellinmap, you agree that:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-gray-600">
              <li>All map pins must accurately reflect the geographic location of the property, vehicle, or service within Sri Lanka.</li>
              <li>Listings must not promote prohibited items, counterfeit merchandise, stolen goods, or illegal services under Sri Lankan law.</li>
              <li>Prices must be listed in Sri Lankan Rupees (LKR / Rs.) and reflect genuine asking prices without deceptive lowball tags.</li>
              <li>Sellinmap reserves the unconditional right to unpublish, edit, or remove any listing that breaches platform guidelines or receives multiple community fraud reports.</li>
            </ul>
          </section>

          {/* Section 4: Golden Pin Upgrades & Payments */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <DollarSign size={18} className="text-amber-600" />
              <span>4. Golden Pin Upgrades & Bank Transfers</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Sellinmap offers promotional &ldquo;Golden Pin&rdquo; highlights to elevate visibility on the map:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-gray-600">
              <li>Payment is executed exclusively via direct bank transfer or cash deposit into designated Sellinmap company bank accounts (Commercial Bank or Bank of Ceylon).</li>
              <li>Users must upload a legible, authentic bank transfer slip or deposit receipt. Uploading forged, tampered, or fraudulent receipts will lead to immediate account termination.</li>
              <li>Golden Pin activation occurs upon admin verification (typically within 2 to 4 hours) and remains valid for the stipulated duration (30 days).</li>
              <li>Approved promotional fees are non-refundable once the Golden Pin has been activated on the interactive map.</li>
            </ul>
          </section>

          {/* Section 5: Buyer & Seller Transactions */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Scale size={18} className="text-purple-600" />
              <span>5. Platform Role & Limitation of Liability</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Sellinmap functions as a digital classifieds directory and interactive discovery tool. We are not a party to any transaction, agreement, or transfer of goods between buyers and sellers. Users are urged to exercise due diligence, inspect vehicles/properties in person, and transact through secure legal channels. Sellinmap shall not be held liable for any direct or indirect loss resulting from peer-to-peer agreements.
            </p>
          </section>

          {/* Section 6: Governing Law */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-sky-600" />
              <span>6. Governing Law & Dispute Resolution</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              These terms are governed by and construed in accordance with the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes arising out of the use of Sellinmap shall be subject to the exclusive jurisdiction of the courts of Colombo, Sri Lanka.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
