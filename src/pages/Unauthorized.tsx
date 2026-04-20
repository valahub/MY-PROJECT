import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, ROLE_HOME } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const { primaryRole, signOut } = useAuth();
  const home = primaryRole ? ROLE_HOME[primaryRole] : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to view this page.
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link to={home}>Go to your dashboard</Link>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
