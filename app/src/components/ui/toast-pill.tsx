import { AnimatePresence, motion } from "framer-motion"

type ToastPillProps = {
  message: string | null
}

function ToastPill({ message }: ToastPillProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4"
        >
          <div className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-white shadow-lg">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { ToastPill }
