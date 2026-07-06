import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login, getDemoAccounts } from "../lib/api";
import { setUser } from "../lib/auth";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { UserCircle, Shield, ChalkboardTeacher, Sparkle } from "@phosphor-icons/react";

const ROLE_CFG = {
  admin: { icon: Shield, label: "Admin", email: "admin@school.edu", password: "admin123" },
  principal: { icon: UserCircle, label: "Principal", email: "principal@school.edu", password: "principal123" },
  teacher: { icon: ChalkboardTeacher, label: "Teacher", email: "teacher@school.edu", password: "teacher123" },
};

export default function Login() {
  const nav = useNavigate();
  const [role, setRole] = useState("principal");
  const [email, setEmail] = useState(ROLE_CFG.principal.email);
  const [password, setPassword] = useState(ROLE_CFG.principal.password);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getDemoAccounts().catch(() => {}); }, []);

  const handleRoleChange = (r) => {
    setRole(r);
    setEmail(ROLE_CFG[r].email);
    setPassword(ROLE_CFG[r].password);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password, role);
      setUser({ ...data.user, token: data.token });
      toast.success(`Welcome, ${data.user.name}`);
      nav("/app/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white dark:bg-neutral-950">
      <div className="hidden md:flex flex-col justify-between p-12 bg-klein text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-grid" />
        <div className="relative flex items-center gap-2">
          <div className="h-8 w-8 bg-white/20 grid place-items-center rounded-sm"><Sparkle size={18} weight="fill" /></div>
          <span className="font-display font-black text-xl">Edu Chat</span>
        </div>
        <div className="relative">
          <div className="mono text-xs uppercase tracking-widest text-white/60">Case Study</div>
          <h2 className="mt-4 font-display font-black text-4xl leading-tight">
            &ldquo;It&rsquo;s like ChatGPT, but it actually knows every student in our school.&rdquo;
          </h2>
          <div className="mt-6 text-sm text-white/80">Dr. Priya Menon · Principal, Delhi Public School</div>
        </div>
        <div className="relative text-xs mono text-white/60">© 2026 Edu Chat</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mono text-xs uppercase tracking-widest text-neutral-500">Sign in</div>
          <h1 className="mt-2 font-display font-black text-3xl md:text-4xl tracking-tighter">Welcome back.</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Choose your role to load the right workspace.</p>

          <Tabs value={role} onValueChange={handleRoleChange} className="mt-8">
            <TabsList data-testid="role-tabs" className="grid grid-cols-3 w-full">
              {Object.entries(ROLE_CFG).map(([k, v]) => {
                const I = v.icon;
                return (
                  <TabsTrigger key={k} value={k} data-testid={`role-tab-${k}`} className="flex items-center gap-2">
                    <I size={14} weight="duotone" /> {v.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {Object.keys(ROLE_CFG).map((k) => (
              <TabsContent key={k} value={k} className="mt-6">
                <Card className="border-neutral-200 dark:border-neutral-800">
                  <CardContent className="pt-6">
                    <form onSubmit={submit} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input data-testid="login-email-input" id="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1" autoComplete="email" />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input data-testid="login-password-input" id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1" autoComplete="current-password" />
                      </div>
                      <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full bg-klein hover:bg-klein-dark text-white">
                        {loading ? "Signing in…" : `Sign in as ${ROLE_CFG[k].label}`}
                      </Button>
                      <div className="mono text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        Demo credentials pre-filled · {ROLE_CFG[k].email} / {ROLE_CFG[k].password}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
