import type { OAuthProviderKey, UserRole } from "@ai-interviewer/api-types";
import type { SVGProps } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchOAuthProviders, getOAuthStartUrl } from "../services/auth-api";

type OAuthButtonsProps = {
  role: UserRole;
};

type ProviderIconProps = SVGProps<SVGSVGElement>;

function GoogleIcon({ className, ...props }: ProviderIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.8S8.9 5.7 12 5.7c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.5 3.4 14.5 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 12s4.1 9.5 9.2 9.5c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.3H12z"
      />
    </svg>
  );
}

function GitHubIcon({ className, ...props }: ProviderIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.11-1.48-1.11-1.48-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

const providerMeta: Record<
  OAuthProviderKey,
  { label: string; icon: typeof GoogleIcon; className: string }
> = {
  google: {
    label: "Continue with Google",
    icon: GoogleIcon,
    className: "bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200",
  },
  github: {
    label: "Continue with GitHub",
    icon: GitHubIcon,
    className: "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700",
  },
};

function isOAuthProviderKey(value: string): value is OAuthProviderKey {
  return value === "google" || value === "github";
}

export function OAuthButtons({ role }: OAuthButtonsProps) {
  const [providers, setProviders] = useState<OAuthProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchOAuthProviders()
      .then((configured) => configured.filter(isOAuthProviderKey))
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking sign-in options…</p>;
  }

  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        OAuth providers are not configured yet. Use email and password below.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => {
        const meta = providerMeta[provider];
        if (!meta) return null;

        const Icon = meta.icon;

        return (
          <Button
            key={provider}
            type="button"
            className={`w-full justify-start gap-3 ${meta.className}`}
            onClick={() => {
              window.location.href = getOAuthStartUrl(provider, role);
            }}
          >
            <Icon className="size-4 shrink-0" />
            {meta.label}
          </Button>
        );
      })}
    </div>
  );
}
