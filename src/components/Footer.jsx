import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart } from 'lucide-react';
import { PLATFORM_CONFIG } from '../config/platformConfig';

export default function Footer() {
  return (
    <footer className="bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-2.5 z-[990] shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-800 tracking-tight flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Sellin<span className="text-emerald-600">map</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>{PLATFORM_CONFIG.copyright}</span>
        </div>

        {/* Center: Badge */}
        <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400 font-medium">
          <span>🇱🇰 Sri Lanka's Interactive Map Marketplace</span>
        </div>

        {/* Right: Policy & Contact Links */}
        <div className="flex items-center gap-3.5 font-semibold text-gray-600">
          <Link
            to="/contact"
            className="hover:text-emerald-600 transition-colors"
          >
            Contact Us
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            to="/privacy"
            className="hover:text-emerald-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            to="/terms"
            className="hover:text-emerald-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
