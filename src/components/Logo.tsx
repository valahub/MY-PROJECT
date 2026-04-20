import logo from "@/assets/erp-vala-logo.jpg";

interface Props {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 36, showText = true }: Props) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo}
        alt="ERP Vala"
        width={size}
        height={size}
        className="rounded-md object-cover"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className="font-semibold tracking-tight text-foreground">
          ERP Vala
        </span>
      )}
    </div>
  );
}
