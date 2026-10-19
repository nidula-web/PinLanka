import { ArrowLeft, Shield, Lock, Eye, FileText, Database, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
              Legal & Compliance
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: October 2024 • Applicable to Sellinmap Sri Lanka (sellinmap.com)
            </p>
          </div>

          {/* Section 1: Introduction */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Shield size={18} className="text-emerald-600" />
              <span>1. Introduction</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Welcome to <strong>Sellinmap</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, store, and disclose your personal information when you use our interactive map classifieds platform, website, and related services across Sri Lanka.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              <span>2. Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              We collect information to deliver our geolocation-based classifieds and Golden Pin advertising services:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-gray-600">
              <li>
                <strong>Account & Profile Data:</strong> When registering, we collect your name, email address, phone number, seller type (Owner or Broker), and profile picture.
              </li>
              <li>
                <strong>Listing Information:</strong> Data you provide when publishing an ad, including title, price, descriptions, category, photographs, and precise geographic coordinates (latitude and longitude).
              </li>
              <li>
                <strong>Payment & Verification Slips:</strong> Bank deposit or online fund transfer receipts uploaded for Golden Pin upgrade approvals. These documents are encrypted and accessible strictly by authorized platform administrators.
              </li>
              <li>
                <strong>Geolocation Data:</strong> With your permission, device location data is used to position the map and display nearby pins across Sri Lanka.
              </li>
            </ul>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Eye size={18} className="text-amber-600" />
              <span>3. How We Use Your Information</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Your data is processed strictly for the following purposes:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-gray-600">
              <li>Displaying your listings and property locations accurately on our interactive map.</li>
              <li>Enabling prospective buyers to contact you directly via phone, WhatsApp, or email.</li>
              <li>Admin verification and approval of Golden Pin manual bank transfer upgrades.</li>
              <li>Preventing fraudulent, misleading, or counterfeit listings across Sri Lankan districts.</li>
              <li>Delivering system notifications, status changes, and platform announcements.</li>
            </ul>
          </section>

          {/* Section 4: Data Storage & Security */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Lock size={18} className="text-purple-600" />
              <span>4. Data Security & Storage</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              We implement industry-standard security protocols, including TLS/SSL encryption for data in transit and Row-Level Security (RLS) on our cloud database. Listing photographs and payment slips are securely stored in high-availability cloud storage with role-based access control.
            </p>
          </section>

          {/* Section 5: Third-Party Services */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Globe size={18} className="text-sky-600" />
              <span>5. Third-Party Services & Integrations</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Our service integrates trusted third-party providers including Supabase (Authentication & PostgreSQL Database), Cloudinary (Image Delivery & Optimization), and OpenStreetMap / Esri (Geographic Tiles). These providers handle data under strict data privacy standards.
            </p>
          </section>

          {/* Section 6: User Rights */}
          <section className="space-y-2">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <FileText size={18} className="text-rose-600" />
              <span>6. Your Rights & Account Management</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              Under applicable Sri Lankan laws, you maintain the right to access, update, or permanently delete your listings and account profile at any time through your Profile Dashboard, or by submitting a written request to <a href="mailto:privacy@sellinmap.com" className="text-emerald-600 font-bold hover:underline">privacy@sellinmap.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
