import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Users, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
};

export function FeaturesSection() {
  const { lang } = useApp();

  const features = [
    { icon: MapPin,          title: lang === 'kn' ? 'ನಕ್ಷೆ ಇಂಟರ್‌ಫೇಸ್' : 'Map Interface',           description: lang === 'kn' ? 'ಮಂಡ್ಯದಾದ್ಯಂತ ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳನ್ನು (ಗುಂಡಿ, ನೀರು, ವಿದ್ಯುತ್) ತೋರಿಸುವ ಇಂಟರಾಕ್ಟಿವ್ ಪಿನ್‌ಗಳು.' : 'Interactive pins showing active issues (Potholes, Water leaks, Power outages) across Mandya.' },
    { icon: AlertTriangle,   title: lang === 'kn' ? 'ವಿವರವಾದ ಫೀಡ್ ವಿಷಯ' : 'Detailed Feed Content',    description: lang === 'kn' ? 'ಸಮಸ್ಯೆ ವಿವರಣೆ, ನಿರ್ದಿಷ್ಟ ಸ್ಥಳ ಮತ್ತು ಜವಾಬ್ದಾರ ಇಲಾಖೆ (CMC, CESC, PWD) ವೀಕ್ಷಿಸಿ.' : 'View problem descriptions, specific locations, and the responsible Department (BESCOM, PWD, BWSSB, TMC).' },
    { icon: Users,           title: lang === 'kn' ? 'ಸಮುದಾಯ ಕ್ರಿಯೆ' : 'Community Action',          description: lang === 'kn' ? '"ನಾನೂ ಭಾಗಿ" ಮೂಲಕ ಸಮಸ್ಯೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅಪ್‌ವೋಟ್ ಮಾಡಿ. ಪ್ರಭಾವಿತ ನಾಗರಿಕರ ಮೆಟ್ರಿಕ್ ನೋಡಿ.' : 'Verify and upvote issues with "Add Me Too". See the "Social Proof" metric showing citizens affected.' },
    { icon: Clock,           title: lang === 'kn' ? 'ಸಮಯ-ಸಂವೇದನಶೀಲ ಟ್ರ್ಯಾಕಿಂಗ್' : 'Time-Sensitive Tracking', description: lang === 'kn' ? 'ರಸ್ತೆ, ನೀರು, ವಿದ್ಯುತ್, ಚರಂಡಿ ಮತ್ತು ಆರೋಗ್ಯ ವಿಭಾಗಗಳಲ್ಲಿ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನ ಸಕ್ರಿಯವಾಗಿದೆ ಎಂದು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.' : 'Track how many days an issue has been active across all categories: Roads, Water, Power, Drainage, and Health.' },
  ];

  return (
    <section className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 id="feed" className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-charcoal mb-4 tracking-[-0.01em]">
            {lang === 'kn' ? 'ನೇರ ನಾಗರಿಕ ಫೀಡ್' : 'Live Civic Feed'}
          </h2>
          <p className="text-lg text-stone max-w-xl mx-auto">
            {lang === 'kn' ? 'ಅಪ್‌ಡೇಟ್ ಆಗಿರಿ. ನಿಮ್ಮ ಸಮುದಾಯ ವರದಿ ಮಾಡಿದ ನೇರ ಮೂಲಸೌಕರ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ.' : 'Stay updated. View active infrastructure issues reported by your community in real-time.'}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group p-8 bg-white rounded-2xl border border-border hover:border-charcoal/20 transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-transparent mb-6 group-hover:bg-teal/10 transition-colors">
                <feature.icon className="w-6 h-6 text-charcoal" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-charcoal mb-3">
                {feature.title}
              </h3>
              <p className="text-stone leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
