import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const departments = [
  'TMC (City Council)',
  'BESCOM (Power)',
  'PWD (Roads)',
  'BWSSB (Water)',
  'Health Department',
  'Traffic Police',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

export function SpecialtiesSection() {
  return (
    <section className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-stone uppercase tracking-wider mb-3">
              Administrative Directory
            </p>
            <h2 id="directory" className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-charcoal mb-4 tracking-[-0.01em]">
              Local Bodies & Departments
            </h2>
            <p className="text-lg text-stone mb-8 max-w-md">
              Access core responsibilities, direct contact details for Responsible Officers, map locations, and real-time workload (active complaints assigned) for all civic departments.
            </p>
            <a
              href="#directory-full"
              className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white text-sm font-medium rounded-full hover:bg-charcoal/90 transition-all hover:scale-[1.02]"
            >
              View Full Directory
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Right Column - Specialties & Art */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative flex flex-wrap gap-3 items-start justify-start"
          >
            {departments.map((dept) => (
              <motion.a
                key={dept}
                href={`#${dept.toLowerCase().replace(/\s+/g, '-')}`}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="z-10 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-full hover:bg-charcoal/90 transition-colors shadow-sm"
              >
                {dept}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
