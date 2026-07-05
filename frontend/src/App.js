import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./lib/theme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Students from "./pages/Students";
import Files from "./pages/Files";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { getUser } from "./lib/auth";

function Protected({ children }) {
  const u = getUser();
  if (!u) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<Protected><Upload /></Protected>} />
          <Route path="/app" element={<Protected><AppShell /></Protected>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:sessionId" element={<Chat />} />
            <Route path="students" element={<Students />} />
            <Route path="files" element={<Files />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
