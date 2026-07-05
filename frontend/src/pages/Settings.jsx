import { useTheme } from "../lib/theme";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { getUser, clearUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { seed } from "../lib/api";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const u = getUser();
  const nav = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mono text-xs uppercase tracking-widest text-neutral-500">Preferences</div>
      <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mb-8">Settings</h1>

      <Card className="border-neutral-200 dark:border-neutral-800 mb-4">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark mode</div>
              <div className="text-sm text-neutral-500">Switch between Editorial Light and Charcoal Dark themes.</div>
            </div>
            <Switch data-testid="dark-mode-switch" checked={theme==="dark"} onCheckedChange={(v)=>setTheme(v?"dark":"light")} />
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <div>
              <div className="font-medium">Signed in as</div>
              <div className="text-sm text-neutral-500">{u?.name} · <span className="mono uppercase">{u?.role}</span></div>
            </div>
            <Button data-testid="settings-logout-btn" variant="outline" onClick={()=>{ clearUser(); nav("/"); toast.success("Signed out"); }}>Sign out</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <div className="font-medium">Reset demo data</div>
            <div className="text-sm text-neutral-500">Rebuilds the 300-student demo school. Any uploaded file is replaced.</div>
          </div>
          <Button data-testid="reset-demo-btn-settings" onClick={async()=>{ await seed(300); toast.success("Demo reseeded"); }} className="bg-klein hover:bg-klein-dark text-white">Reset</Button>
        </CardContent>
      </Card>
    </div>
  );
}
