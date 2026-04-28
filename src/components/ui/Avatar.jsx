import { useState } from "react";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitials, MIHAI_AVATAR_URL } from "@/utils/avatar";

const SIZE = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  src,
  name,
  seed,
  size = "md",
  kind = "user",
  className,
  alt,
  title,
}) {
  const isMihai = kind === "mihai";
  const displayName = isMihai ? "mihAI" : name || "Utilizator";
  const imageSrc = isMihai ? src ?? MIHAI_AVATAR_URL : src ?? null;
  const initials = isMihai ? "mA" : getInitials(displayName);
  const color = isMihai
    ? "from-brand-500 to-brand-700"
    : getAvatarColor(seed || displayName);

  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !imageFailed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-bold text-white shadow-sm ring-2 ring-white",
        color,
        SIZE[size] ?? SIZE.md,
        className,
      )}
      title={title ?? displayName}
      aria-label={alt ?? `Avatar ${displayName}`}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt={alt ?? displayName}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}
