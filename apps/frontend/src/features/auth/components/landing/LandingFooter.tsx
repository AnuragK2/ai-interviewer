import { Link } from "react-router";

const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Product demo", href: "#product" },
    { label: "Testimonials", href: "#testimonials" },
  ],
  candidates: [
    { label: "Create account", to: "/register?role=candidate" },
    { label: "Sign in", to: "/login?role=candidate" },
    { label: "Browse jobs", to: "/register?role=candidate" },
  ],
  recruiters: [
    { label: "Create company", to: "/register?role=recruiter" },
    { label: "Sign in", to: "/login?role=recruiter" },
    { label: "Post a job", to: "/register?role=recruiter" },
  ],
} as const;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
              Get<span className="text-indigo-300">Hired</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered hiring for modern teams. Profiles, fit analysis, proctored interviews, and structured
              feedback — all in one place.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/80 transition-colors hover:text-indigo-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Candidates</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.candidates.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-foreground/80 transition-colors hover:text-indigo-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recruiters</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.recruiters.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-foreground/80 transition-colors hover:text-indigo-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {year} GetHired. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
