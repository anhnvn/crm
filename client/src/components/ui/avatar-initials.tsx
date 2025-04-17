import { cn } from "@/lib/utils";

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AvatarInitials({ name, size = "md", className }: AvatarInitialsProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium",
        sizeClasses[size],
        className
      )}
    >
      <span>{initials}</span>
    </div>
  );
}
