import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildJobShareLinks, getPublicJobUrl, type JobShareChannel } from "../lib/job-share";

type JobShareButtonsProps = {
  job: {
    id: string;
    title: string;
    location?: string | null;
  };
  compact?: boolean;
};

const shareChannels: Array<{
  id: JobShareChannel;
  label: string;
  className: string;
}> = [
  { id: "facebook", label: "Facebook", className: "border-[#1877F2]/30 bg-[#1877F2]/10 text-[#8CB4FF] hover:bg-[#1877F2]/20" },
  { id: "whatsapp", label: "WhatsApp", className: "border-[#25D366]/30 bg-[#25D366]/10 text-[#8CF0B3] hover:bg-[#25D366]/20" },
  { id: "telegram", label: "Telegram", className: "border-[#2AABEE]/30 bg-[#2AABEE]/10 text-[#9EDBFF] hover:bg-[#2AABEE]/20" },
  { id: "linkedin", label: "LinkedIn", className: "border-[#0A66C2]/30 bg-[#0A66C2]/10 text-[#8CB8FF] hover:bg-[#0A66C2]/20" },
  { id: "gmail", label: "Gmail", className: "border-white/10 bg-white/5 text-foreground hover:bg-white/10" },
];

export function JobShareButtons({ job, compact = false }: JobShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const links = buildJobShareLinks(job);
  const publicUrl = getPublicJobUrl(job.id);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Job link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Share2 className="size-4 text-indigo-300" />
            Share this job
          </div>
          {!compact ? (
            <p className="text-xs text-muted-foreground">Send the public job link via social apps or email.</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 bg-white/5"
          onClick={() => void copyLink()}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {shareChannels.map((channel) => {
          const Icon = channel.id === "gmail" ? Mail : Link2;
          const href = links[channel.id];
          const isExternal = channel.id !== "gmail";

          return (
            <Button
              key={channel.id}
              asChild
              type="button"
              variant="outline"
              size="sm"
              className={channel.className}
            >
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                <Icon className="size-4" />
                {channel.label}
              </a>
            </Button>
          );
        })}
      </div>

      {!compact ? (
        <p className="truncate text-xs text-muted-foreground">
          Public link: <span className="font-mono text-foreground/80">{publicUrl}</span>
        </p>
      ) : null}
    </div>
  );
}
