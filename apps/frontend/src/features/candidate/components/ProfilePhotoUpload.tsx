import { Camera } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/shared/components/loading";

type ProfilePhotoUploadProps = {
  photoUrl: string | null;
  fallbackPhotoUrl?: string | null;
  displayName?: string | null;
  uploading?: boolean;
  onSelectFile: (file: File) => void;
};

function getInitials(name?: string | null) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function ProfilePhotoUpload({
  photoUrl,
  fallbackPhotoUrl,
  displayName,
  uploading = false,
  onSelectFile,
}: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = photoUrl ?? fallbackPhotoUrl ?? null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
        {imageUrl ? (
          <img src={imageUrl} alt={displayName ? `${displayName} profile` : "Profile photo"} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-indigo-500/10 text-2xl font-semibold text-indigo-200">
            {getInitials(displayName)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">
            Upload a clear headshot so recruiters can recognize you. JPG, PNG, or WEBP up to 2 MB.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelectFile(file);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ButtonLoading loading={uploading} loadingText="Uploading…">
            <span className="inline-flex items-center gap-2">
              <Camera className="size-4" />
              {imageUrl ? "Change photo" : "Upload photo"}
            </span>
          </ButtonLoading>
        </Button>
      </div>
    </div>
  );
}
