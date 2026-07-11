import { Link } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
          Get<span className="text-indigo-300">Hired</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
