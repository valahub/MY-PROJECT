// UX Micro Fixes for Dashboard
// Button hover, click feedback, disabled states, loading states, focus states

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// BUTTON WITH MICRO INTERACTIONS
// ============================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ripple?: boolean;
}

export function InteractiveButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  ripple = true,
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Add ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    // Call onClick handler
    if (onClick) {
      await onClick();
    }
  }, [disabled, loading, ripple, onClick]);

  const handleMouseDown = useCallback(() => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/70',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/70',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        isPressed && 'scale-95',
        className
      )}
    >
      {/* Ripple effects */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute inset-0 overflow-hidden rounded-md"
          style={{ pointerEvents: 'none' }}
        >
          <span
            className="absolute block h-full w-full rounded-full bg-white/30 animate-in fade-out"
            style={{
              left: r.x,
              top: r.y,
              width: '200px',
              height: '200px',
              marginLeft: '-100px',
              marginTop: '-100px',
              transform: 'scale(0)',
              animation: 'ripple 600ms ease-out',
            }}
          />
        </span>
      ))}

      {/* Loading spinner */}
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {children}
    </button>
  );
}

// ============================================
// ICON BUTTON WITH MICRO INTERACTIONS
// ============================================

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  className?: string;
}

export function InteractiveIconButton({
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className,
}: IconButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || loading) return;
    if (onClick) {
      await onClick();
    }
  }, [disabled, loading, onClick]);

  const handleMouseDown = useCallback(() => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    setShowTooltip(false);
  }, []);

  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
    ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/70',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/70',
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setShowTooltip(!!tooltip)}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          isPressed && 'scale-95',
          className
        )}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded-md shadow-md whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ============================================
// CARD WITH HOVER EFFECTS
// ============================================

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  hover?: boolean;
  lift?: boolean;
}

export function InteractiveCard({
  children,
  onClick,
  disabled = false,
  className,
  hover = true,
  lift = true,
}: InteractiveCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled || !onClick) return;
    onClick();
  }, [disabled, onClick]);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm transition-all duration-200',
        hover && !disabled && 'hover:shadow-md hover:border-primary/50 cursor-pointer',
        lift && !disabled && 'hover:-translate-y-0.5',
        isPressed && 'scale-98',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// INPUT WITH MICRO INTERACTIONS
// ============================================

interface InteractiveInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InteractiveInput({
  label,
  error,
  size = 'md',
  className,
  ...props
}: InteractiveInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          isFocused && 'ring-2 ring-ring ring-offset-2',
          error && 'border-destructive focus-visible:ring-destructive',
          sizeStyles[size],
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// ============================================
// TOGGLE SWITCH WITH MICRO INTERACTIONS
// ============================================

interface InteractiveToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function InteractiveToggle({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  className,
}: InteractiveToggleProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onCheckedChange(!checked);
  }, [disabled, checked, onCheckedChange]);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-input',
          isPressed && 'scale-95',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </div>
  );
}

// ============================================
// ADD CSS ANIMATIONS FOR RIPPLE EFFECT
// ============================================

export function addRippleStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'ripple-animations';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-add styles on module load
if (typeof window !== 'undefined') {
  addRippleStyles();
}
