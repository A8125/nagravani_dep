import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/translations';

export function HeroSection() {
  const { lang } = useApp();
  const tr = t[lang];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* ── Left side text block (Restored to normal left-alignment) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-[45%] mt-10 md:mt-0 text-left"
          >
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-[76px] leading-[1.05] tracking-[-0.02em] text-charcoal mb-6">
              {lang === 'kn' ? (
                <>ನಿಮ್ಮ <span className="text-red-600">ನಗರ.</span></>
              ) : (
                <>Your <span className="text-red-600">City.</span></>
              )}<br />
              {lang === 'kn' ? (
                <>ನಿಮ್ಮ <span className="text-red-600">ಧ್ವನಿ.</span></>
              ) : (
                <>Your <span className="text-red-600">Voice.</span></>
              )}<br />
              {lang === 'kn' ? (
                <>ನಿಮ್ಮ <span className="text-red-600">ಸಮಾಧಾನ.</span></>
              ) : (
                <>Your <span className="text-red-600">Fix.</span></>
              )}
            </h1>
            <p className="text-lg text-stone leading-relaxed mb-8 max-w-md">
              {tr.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/raise"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-charcoal text-white text-sm font-medium rounded-full hover:bg-charcoal/90 transition-all hover:scale-[1.02] shadow-sm"
              >
                {tr.heroCTA1}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#map"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-charcoal text-sm font-medium rounded-full border border-border hover:bg-transparent transition-all hover:scale-[1.02]"
              >
                {tr.heroCTA2}
              </a>
            </div>
          </motion.div>

          {/* ── Right side beautifully arranged dynamic collage ── */}
          <div className="md:w-[55%] relative h-[450px] sm:h-[550px] md:h-[700px] w-full flex items-center justify-center pointer-events-none mt-4 md:mt-0">
            
            {/* Center dominant image — Traffic Police */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.95 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute z-20 w-[45%] md:w-[40%] top-[25%]"
            >
              <motion.img 
                src="/traffic-police-scribble-t.png" alt="Traffic Police" 
                animate={{ y: [0, -12, 0] }} 
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }} 
                className="w-full drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal" 
              />
            </motion.div>

            {/* Top Left overlapping — Plumber */}
            <motion.div
              initial={{ x: -40, opacity: 0, rotate: -10 }}
              animate={{ x: 0, opacity: 0.85, rotate: -5 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute z-10 w-[35%] md:w-[32%] top-[5%] left-[5%] md:left-[10%]"
            >
              <motion.img 
                src="/plumber-scribble-t.png" alt="Plumber" 
                animate={{ y: [0, -8, 0] }} 
                transition={{ repeat: Infinity, duration: 4.5, delay: 0.5, ease: 'easeInOut' }} 
                className="w-full drop-shadow-xl mix-blend-multiply dark:mix-blend-normal" 
              />
            </motion.div>

            {/* Top Right overlapping — Electric Lineman */}
            <motion.div
              initial={{ x: 40, opacity: 0, rotate: 10 }}
              animate={{ x: 0, opacity: 0.85, rotate: 5 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="absolute z-10 w-[38%] md:w-[35%] top-[10%] right-[0%] md:right-[5%]"
            >
              <motion.img 
                src="/electric-lineman-t.png" alt="Lineman" 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 5, delay: 1, ease: 'easeInOut' }} 
                className="w-full drop-shadow-xl mix-blend-multiply dark:mix-blend-normal" 
              />
            </motion.div>

            {/* Bottom Left overlapping — Street Cleaner */}
            <motion.div
              initial={{ x: -40, opacity: 0, rotate: 5 }}
              animate={{ x: 0, opacity: 0.95, rotate: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute z-30 w-[35%] md:w-[32%] bottom-[15%] md:bottom-[20%] left-[10%] md:left-[15%]"
            >
              <motion.img 
                src="/street-cleaner-t.png" alt="Cleaner" 
                animate={{ y: [0, -8, 0] }} 
                transition={{ repeat: Infinity, duration: 4.8, delay: 1.5, ease: 'easeInOut' }} 
                className="w-full drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal" 
              />
            </motion.div>

            {/* Bottom Right overlapping — Road Worker */}
            <motion.div
              initial={{ x: 40, opacity: 0, rotate: -5 }}
              animate={{ x: 0, opacity: 0.95, rotate: -8 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute z-30 w-[38%] md:w-[35%] bottom-[10%] md:bottom-[15%] right-[5%] md:right-[15%]"
            >
              <motion.img 
                src="/road-worker-t.png" alt="Worker" 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 5.2, delay: 0.2, ease: 'easeInOut' }} 
                className="w-full drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal" 
              />
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
