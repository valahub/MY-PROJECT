import logoImg from "@/assets/erp-vala-logo.jpg";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size }: LogoProps) {
  const style = size ? { height: size, width: size } : undefined;
  return (
    <img
      src={logoImg}
      alt="ERP Vala"
      className={cn(!size && "h-8", className)}
      style={style}
    />
  );
}

export function LogoText() {
  return (
    <div className="flex items-center gap-2">
      <Logo className="h-8 w-8 rounded" />
      <span className="text-lg font-bold text-foreground">ERP Vala</span>
    </div>
  );
}
