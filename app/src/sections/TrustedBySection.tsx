import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

export function TrustedBySection() {
  const { lang } = useApp();

  const stats = [
    { value: '12,450+', label: lang === 'kn' ? 'ಒಟ್ಟು ದೂರುಗಳು' : 'Total Complaints Raised', id: 'complaints' },
    { value: '94%',     label: lang === 'kn' ? 'ಪರಿಹಾರ ಶೇಕಡಾ' : 'Resolution Percentage', id: 'resolution' },
    { value: '24 Hours',label: lang === 'kn' ? '​ಸರಾಸರಿ ಪರಿಹಾರ ಸಮಯ' : 'Average Resolution Time', id: 'time' },
  ];

  return (
    <section className="py-12 lg:py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }}
          className="text-center text-sm font-medium text-stone uppercase tracking-wider mb-8"
        >
          {lang === 'kn' ? 'ಮಂಡ್ಯ ನಗರ ಮೂಲಸೌಕರ್ಯ ಮೆಟ್ರಿಕ್ಸ್' : 'Mandya City Infrastructure Metrics'}
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex flex-wrap justify-center items-center gap-8 lg:gap-12"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              className="flex flex-col items-center justify-center text-center p-4 bg-white rounded-2xl shadow-sm border border-border w-full min-w-[240px] max-w-[300px]"
            >
              <span className="text-3xl lg:text-4xl font-bold text-charcoal mb-2">
                {stat.value}
              </span>
              <span className="text-sm text-stone uppercase tracking-wide">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
