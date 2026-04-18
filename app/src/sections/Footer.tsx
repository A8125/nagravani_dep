import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const productLinks = [
  { name: 'Live Civic Feed', href: '/feed', isRoute: true },
  { name: 'Report Issue', href: '/raise', isRoute: true },
  { name: 'Directory', href: '/departments', isRoute: true },
];

const specialtyLinks = [
  { name: 'Roads & Potholes', href: '#' },
  { name: 'Water & Supply', href: '#' },
  { name: 'Power Outages', href: '#' },
  { name: 'Drainage Issues', href: '#' },
  { name: 'Public Health', href: '#' },
];

const companyLinks = [
  { name: 'Citizen Dashboard', href: '#dashboard' },
  { name: 'AI Hub / Q&A', href: '#ai' },
  { name: 'Contact Us', href: '#contact' },
  { name: 'About Mandya', href: '#' },
];

  export function Footer() {
    return (
      <footer className="relative py-16 lg:py-20 bg-cream/80 backdrop-blur-xl border-t border-charcoal/5 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12"
        >
          {/* Logo & Contact */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-6">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-charcoal"
              >
                <path
                  d="M8 8C8 8 12 4 16 4C20 4 24 8 24 8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8 16C8 16 12 12 16 12C20 12 24 16 24 16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8 24C8 24 12 20 16 20C20 20 24 24 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xl font-bold text-charcoal">NagaraVaani (ನಗರ ವಾಣಿ)</span>
            </a>
            <p className="text-sm text-charcoal/80 font-medium mb-4">
              © 2026 NagaraVaani Mandya.
            </p>
            <a
              href="mailto:support@nagaravaani.in"
              className="text-sm font-medium text-charcoal/80 hover:text-charcoal transition-colors link-underline"
            >
              support@nagaravaani.in
            </a>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://x.com/nagaravaani"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal/70 hover:text-charcoal transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/js-abhishek-b5820b337/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal/70 hover:text-charcoal transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-charcoal mb-4">Platform</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors link-underline"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors link-underline"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* By Specialty Links */}
          <div>
            <h4 className="text-sm font-semibold text-charcoal mb-4">Categories</h4>
            <ul className="space-y-3">
              {specialtyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors link-underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-charcoal mb-4">Community</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors link-underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
