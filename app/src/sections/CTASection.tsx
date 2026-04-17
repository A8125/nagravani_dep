import { motion } from 'framer-motion';
import { Bot, Target } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function CTASection() {
  const { lang } = useApp();

  return (
    <section className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 id="ai" className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-charcoal mb-4 tracking-[-0.01em] max-w-2xl mx-auto">
            {lang === 'kn' ? 'ನಾಗರಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು AI ಕೇಂದ್ರ' : 'Citizen Dashboard & AI Hub'}
          </h2>
          <p className="text-lg text-stone mb-8 max-w-2xl mx-auto">
            {lang === 'kn'
              ? '"ಸಿಟಿ ಗಾರ್ಡಿಯನ್" ಬ್ಯಾಡ್ಜ್ ಮತ್ತು ವೌಚರ್‌ಗಳನ್ನು ಗಳಿಸಿ. ಅಥವಾ ನಮ್ಮ ವಾಯ್ಸ್ ಪೋರ್ಟಲ್ ಮತ್ತು WhatsApp ಬಾಟ್ ಬಳಸಿ ದ್ವಿಭಾಷಾ ವರದಿ ಮಾಡಿ.'
              : 'Earn "City Guardian" badges and vouchers for successful resolutions. Or use our Voice Portal and WhatsApp Bot for easy bilingual reporting.'
            }
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-charcoal text-white text-base font-medium rounded-full hover:bg-charcoal/90 transition-all hover:scale-[1.02]">
              <Target className="w-5 h-5" />
              {lang === 'kn' ? 'ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'My Dashboard'}
            </a>
            <a href="#whatsapp" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-charcoal text-base font-medium rounded-full border border-border hover:bg-transparent transition-all hover:scale-[1.02]">
              <Bot className="w-5 h-5" />
              {lang === 'kn' ? 'WhatsApp AI ಬಾಟ್' : 'WhatsApp AI Bot'}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
