import type { UserRole } from "@ai-interviewer/api-types";
import { Briefcase, CreditCard, FileText, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { motion } from "motion/react";
import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-context";
import { cn } from "@/shared/lib/utils";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
};

const candidateNav: NavItem[] = [
  { label: "Dashboard", to: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Profile", to: "/candidate/profile", icon: UserCircle },
  { label: "Jobs", to: "/candidate/jobs", icon: Briefcase },
  { label: "Applications", to: "/candidate/applications", icon: FileText },
];

const recruiterNav: NavItem[] = [
  { label: "Dashboard", to: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", to: "/recruiter/jobs", icon: Briefcase },
  { label: "Billing", to: "/recruiter/billing", icon: CreditCard },
];

type AppNavbarProps = {
  role: UserRole;
};

export function AppNavbar({ role }: AppNavbarProps) {
  const { user, logout } = useAuth();
  const items = role === "RECRUITER" ? recruiterNav : candidateNav;
  const accent = role === "RECRUITER" ? "from-amber-500/80 to-orange-500/80" : "from-indigo-500/80 to-blue-500/80";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={role === "RECRUITER" ? "/recruiter/dashboard" : "/candidate/dashboard"}
            className="group flex items-center gap-2"
          >
            <span className={cn("h-2 w-2 rounded-full bg-gradient-to-r", accent)} />
            <span className="text-sm font-semibold tracking-tight">
              Get<span className="text-indigo-300">Hired</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-[12rem] truncate text-xs font-medium">{user?.name ?? user?.email}</p>
              {role === "RECRUITER" && user?.company?.name ? (
                <p className="max-w-[12rem] truncate text-[11px] text-muted-foreground">{user.company.name}</p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-white/10 bg-white/5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  isActive ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </motion.header>
  );
}
