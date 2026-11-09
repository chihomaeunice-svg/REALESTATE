import { motion } from "framer-motion";

export function SquiggleLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" fill="none" className={className} aria-hidden="true">
      <motion.path
        d="M4 90 C 60 10, 110 110, 160 40 S 260 10, 296 60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
