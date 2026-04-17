import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export function HowItWorksSection() {
  const { lang } = useApp();

  const steps = [
    {
      number: '01',
      title: lang === 'kn' ? 'ನಿಖರ ಸ್ಥಳ' : 'Precise Location',
      description: lang === 'kn'
        ? 'ಇಂಟರಾಕ್ಟಿವ್ ನಕ್ಷೆ ಅಥವಾ GPS ಮೂಲಕ ನಿಖರ ಸ್ಥಳ ಗುರುತಿಸಿ.'
        : 'Pinpoint the exact location using precise geotagging via the interactive map or GPS.',
    },
    {
      number: '02',
      title: lang === 'kn' ? 'ದೃಶ್ಯ ಸಾಕ್ಷ್ಯ' : 'Visual Evidence',
      description: lang === 'kn'
        ? 'ಸಮಸ್ಯೆಯ ಸ್ಪಷ್ಟ ದೃಶ್ಯ ಪುರಾವೆ ನೀಡಲು ಮಲ್ಟಿ-ಫೈಲ್ ಮೀಡಿಯಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'
        : 'Upload multi-file media to provide clear visual proof of the reported issue.',
    },
    {
      number: '03',
      title: lang === 'kn' ? 'ಸಮಸ್ಯೆ ವಿವರಗಳು' : 'Issue Details',
      description: lang === 'kn'
        ? 'ತೀವ್ರತೆ ಮತ್ತು ದೈನಂದಿನ ಪ್ರಭಾವ ಮೌಲ್ಯಾಂಕನ. ಪಠ್ಯ ಆಧಾರದ ಮೇಲೆ ಸ್ವಯಂ ಇಲಾಖೆ ರೂಟಿಂಗ್.'
        : 'Evaluate severity and daily impact. Automatic department routing is done based on your text input.',
    },
    {
      number: '04',
      title: lang === 'kn' ? 'ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಪರಿಹಾರ' : 'Tracking & Resolution',
      description: lang === 'kn'
        ? 'ತಕ್ಷಣ ದೂರು ID ಪಡೆದು ಸಾಮಾಜಿಕ ಆಯ್ಕೆಗಳ ಮೂಲಕ ಸುಲಭವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ.'
        : 'Instantly receive a Confirmation Complaint ID and easily share details via social options.',
    },
  ];

  const badges = lang === 'kn'
    ? ['ತ್ವರಿತ ಸೆಟಪ್', 'IT ಅಗತ್ಯವಿಲ್ಲ', 'ಮೀಸಲು ತಂಡ', 'ಅನುಕೂಲಿತ ಅನುಭವ']
    : ['Quick setup', 'No IT required', 'Dedicated team', 'Tailored experience'];

  return (
    <section className="py-20 lg:py-28 bg-transparent relative overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="report" className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-charcoal mb-6 tracking-[-0.01em]">
            {lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ವರದಿ ಹರಿವು' : 'Smart Reporting Flow'}
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="px-4 py-2 text-sm font-medium bg-white border border-border text-stone hover:bg-transparent transition-colors">
                {badge}
              </Badge>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants} initial="hidden"
          whileInView="visible" viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={itemVariants} className="text-center md:text-left">
              <span className="font-serif text-5xl lg:text-6xl text-stone/30 mb-4 block">{step.number}</span>
              <h3 className="text-xl font-medium text-charcoal mb-3">{step.title}</h3>
              <p className="text-stone leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
