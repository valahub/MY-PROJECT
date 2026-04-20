import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, ROLE_HOME, type AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserCircle2, Loader2, LogOut } from "lucide-react";

const TEST_ACCOUNTS: Array<{ role: AppRole; email: string; label: string }> = [
  { role: "admin", email: "admin@test.com", label: "Admin" },
  { role: "author", email: "author@test.com", label: "Seller / Author" },
  { role: "customer", email: "customer@test.com", label: "Buyer / Customer" },
  { role: "support", email: "support@test.com", label: "Agent / Support" },
];
const TEST_PASSWORD = "Test#12345";

export function RoleSwitcher() {
  const { user, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<AppRole | "seed" | null>(null);

  async function ensureSeeded() {
    // Idempotent — calls edge function which creates missing accounts.
    await supabase.functions.invoke("seed-test-users");
  }

  async function switchTo(account: (typeof TEST_ACCOUNTS)[number]) {
    setBusy(account.role);
    try {
      // Try login first
      let { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: TEST_PASSWORD,
      });
      if (error) {
        // Likely missing — seed and retry
        await ensureSeeded();
        ({ error } = await supabase.auth.signInWithPassword({
          email: account.email,
          password: TEST_PASSWORD,
        }));
      }
      if (error) {
        toast.error(`Switch failed: ${error.message}`);
        return;
      }
      toast.success(`Signed in as ${account.label}`);
      navigate(ROLE_HOME[account.role], { replace: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {user ? primaryRole ?? "Account" : "Test login"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="text-xs">
          Test mode — instant role switch
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEST_ACCOUNTS.map((acc) => (
          <DropdownMenuItem
            key={acc.role}
            disabled={busy !== null}
            onClick={() => void switchTo(acc)}
            className="flex items-center justify-between"
          >
            <span>{acc.label}</span>
            {busy === acc.role ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="text-[10px] text-muted-foreground uppercase">
                {acc.role}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                toast.success("Signed out");
                navigate("/", { replace: true });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
