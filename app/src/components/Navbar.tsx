import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, Bell, Moon, Sun, Languages } from 'lucide-react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export function Navbar() {
  const { scrolled }    = useScrollPosition();
  const [open, setOpen] = useState(false);
  const location        = useLocation();
  const { darkMode, toggleDark, lang, toggleLang } = useApp();

  const navLinks = lang === 'kn'
    ? [
        { name: 'ನಕ್ಷೆ',        href: '/map' },
        { name: 'ದೂರು',         href: '/raise' },
        { name: 'ಇಲಾಖೆ',        href: '/departments' },
        { name: 'ಫೀಡ್',         href: '/feed' },
        { name: 'AI ಸಹಾಯ',      href: '/ai' },
      ]
    : [
        { name: 'Map',           href: '/map' },
        { name: 'Complaints',    href: '/raise' },
        { name: 'Departments',   href: '/departments' },
        { name: 'Feed',          href: '/feed' },
        { name: 'AI Help',       href: '/ai' },
      ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md shadow-nav border-b border-border dark:border-white/10'
          : 'bg-cream/80 dark:bg-[#0f0f0f]/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 gap-6">

          {/* ── Logo ── */}
          <Link to="/" className="shrink-0 text-base font-semibold text-charcoal dark:text-white tracking-tight">
            {lang === 'kn' ? 'ನಗರವಾಣಿ' : 'NagaraVaani'}
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative group whitespace-nowrap text-sm transition-colors py-1 ${
                  isActive(link.href)
                    ? 'text-charcoal dark:text-white font-semibold'
                    : 'text-stone dark:text-gray-400 font-medium hover:text-charcoal dark:hover:text-white'
                }`}
              >
                {link.name}
                <span 
                  className={`absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 rounded-full transition-transform duration-300 origin-left ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`} 
                />
              </Link>
            ))}
          </div>

          {/* ── Right controls ── */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">

            {/* Bell */}
            <Link to="/profile?tab=notifications"
              className="relative p-2 text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </Link>

            {/* Dark mode */}
            <button onClick={toggleDark}
              className="p-2 rounded-full text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-stone/10 dark:hover:bg-white/10 transition-all">
              {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Language */}
            <button onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full border border-border dark:border-white/10 text-stone dark:text-gray-300 hover:bg-stone/10 dark:hover:bg-white/10 transition-all">
              <Languages className="w-3 h-3" />
              {lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>

            {/* Thin separator */}
            <span className="w-px h-5 bg-stone/20 dark:bg-white/10 mx-1" />

            {/* Govt Portal — ghost/outline */}
            <Link to="/admin"
              className="text-sm font-medium text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition-colors">
              {lang === 'kn' ? 'ಸರ್ಕಾರ' : 'Govt Portal'}
            </Link>

            {/* Report Issue — solid pill */}
            <Link to="/raise"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm ml-1">
              {lang === 'kn' ? 'ದೂರು ನೋಂದಾಯಿಸಿ' : 'Report Issue'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── Mobile: compact controls ── */}
          <div className="lg:hidden flex items-center gap-1.5">
            <button onClick={toggleDark} className="p-2 text-stone dark:text-gray-300 hover:text-charcoal dark:hover:text-white">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={toggleLang}
              className="px-2 py-1 text-[11px] font-medium text-stone dark:text-gray-300 border border-border dark:border-white/10 rounded-full">
              {lang === 'en' ? 'ಕ' : 'EN'}
            </button>
            <button onClick={() => setOpen(!open)} className="p-2">
              {open
                ? <X    className="w-5 h-5 text-charcoal dark:text-white" />
                : <Menu className="w-5 h-5 text-charcoal dark:text-white" />
              }
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-cream dark:bg-[#0f0f0f] border-t border-border dark:border-white/10"
          >
            <div className="px-6 py-5 space-y-3">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href} onClick={() => setOpen(false)}
                  className={`block text-sm font-medium py-1 ${
                    isActive(link.href) ? 'text-charcoal dark:text-white' : 'text-stone dark:text-gray-400'
                  }`}>
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-border dark:border-white/10 flex flex-col gap-2.5">
                <Link to="/admin" onClick={() => setOpen(false)}
                  className="text-sm font-medium text-stone dark:text-gray-400 hover:text-charcoal dark:hover:text-white">
                  {lang === 'kn' ? 'ಸರ್ಕಾರ ಪೋರ್ಟಲ್' : 'Govt Portal'}
                </Link>
                <Link to="/raise" onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full w-fit">
                  {lang === 'kn' ? 'ದೂರು ನೋಂದಾಯಿಸಿ' : 'Report Issue'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}