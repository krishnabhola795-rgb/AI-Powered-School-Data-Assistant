import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { House, ChatCircle, Users, FileArrowUp, ChartLine, Gear, SignOut, Moon, Sun, Sparkle } from "@phosphor-icons/react";
import { clearUser, getUser } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Button } from "./ui/button";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: House, id: "nav-dashboard" },
  { to: "/app/chat", label: "AI Chat", icon: ChatCircle, id: "nav-chat" },
  { to: "/app/students", label: "Student Database", icon: Users, id: "nav-students" },
  { to: "/app/files", label: "Uploaded Files", icon: FileArrowUp, id: "nav-files" },
  { to: "/app/reports", label: "Reports", icon: ChartLine, id: "nav-reports" },
  { to: "/app/settings", label: "Settings", icon: Gear, id: "nav-settings" },
];

export default function AppShell() {
  const nav = useNavigate();
  const u = getUser();
  const { theme, setTheme } = useTheme();
  const logout = () => { clearUser(); nav("/"); };

  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sidebar */}
      <aside data-testid="app-sidebar" className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="h-7 w-7 bg-klein grid place-items-center rounded-sm">
            <Sparkle weight="fill" size={16} color="#fff" />
          </div>
          <div>
            <div className="font-display font-black text-sm leading-none">EduChat AI</div>
            <div className="mono text-[10px] text-neutral-500 mt-0.5">School Intelligence</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const I = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.id}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-klein text-white"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`
                }
              >
                <I size={16} weight="duotone" /> {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-klein/10 text-klein grid place-items-center font-display font-black text-sm">
              {(u?.name || "?").slice(0,1)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{u?.name}</div>
              <div className="mono text-[10px] uppercase text-neutral-500">{u?.role}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button data-testid="theme-toggle-btn" variant="outline" size="sm" onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="text-xs">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
            <Button data-testid="logout-btn" variant="outline" size="sm" onClick={logout} className="text-xs">
              <SignOut size={14} className="mr-1" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto thin-scroll">
        <Outlet />
      </main>
    </div>
  );
}
