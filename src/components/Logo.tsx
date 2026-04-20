import logoImg from "@/assets/erp-vala-logo.jpg";

export function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={logoImg} alt="ERP Vala" className={className} />;
}

export function LogoText() {
  return (
    <div className="flex items-center gap-2">
      <Logo className="h-8 w-8 rounded" />
      <span className="text-lg font-bold text-foreground">ERP Vala</span>
    </div>
  );
}
