import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Briefcase className="h-5 w-5 text-primary" />
          Job Tracker
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/applications"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Applications
          </Link>
          <Link
            to="/stats"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Stats
          </Link>
          <Link
            to="/tasks"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Tasks
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/">Sign in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
