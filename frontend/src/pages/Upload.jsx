import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, seed } from "../lib/api";
import { toast } from "sonner";
import { UploadSimple, CheckCircle, FileXls, ArrowLeft, Database } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";

export default function Upload() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | ready
  const [rows, setRows] = useState(0);

  const onFile = (f) => {
    if (!f) return;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      toast.error("Please upload a .xlsx, .xls or .csv file");
      return;
    }
    setFile(f);
  };

  const onSubmit = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      const res = await uploadFile(file);
      setRows(res.rows || 0);
      setStatus("ready");
      toast.success("Database Ready");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
      setStatus("idle");
    }
  };

  const useDemo = async () => {
    setStatus("uploading");
    try {
      const res = await seed(300);
      setRows(res.count);
      setStatus("ready");
      toast.success("Demo school loaded");
    } catch {
      toast.error("Failed to load demo");
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/app/dashboard" className="mono text-xs text-neutral-500 inline-flex items-center gap-1 hover:text-klein"><ArrowLeft size={12} /> Back to app</Link>
        <div className="mt-4 mono text-xs uppercase tracking-widest text-klein">Step 1</div>
        <h1 className="mt-1 font-display font-black text-4xl md:text-5xl tracking-tighter">Upload student data.</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400 max-w-xl">Drop your school&rsquo;s Excel or CSV file. We auto-detect columns like class, marks, attendance, fees and transport.</p>

        <Card className="mt-8 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-8">
            {status !== "ready" && (
              <div
                data-testid="upload-dropzone"
                onDragOver={(e)=>{e.preventDefault();}}
                onDrop={(e)=>{e.preventDefault(); onFile(e.dataTransfer.files?.[0]);}}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-md p-10 text-center hover:border-klein transition-all duration-200"
              >
                <div className="mx-auto h-14 w-14 grid place-items-center bg-klein/10 text-klein rounded-md"><UploadSimple size={28} weight="duotone" /></div>
                <div className="mt-4 font-display font-bold text-lg">Drag & drop your file</div>
                <div className="text-xs text-neutral-500 mt-1">.xlsx, .xls or .csv up to 20MB</div>
                <input
                  id="file-input"
                  data-testid="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e)=>onFile(e.target.files?.[0])}
                />
                <div className="mt-5 flex gap-2 justify-center">
                  <Button data-testid="browse-file-btn" onClick={()=>document.getElementById("file-input").click()} variant="outline">Browse file</Button>
                  <Button data-testid="use-demo-btn" variant="ghost" onClick={useDemo} className="text-klein"><Database size={14} className="mr-1" /> Use 300-student demo</Button>
                </div>
                {file && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm mono">
                    <FileXls size={16} weight="duotone" className="text-klein" /> {file.name}
                  </div>
                )}
              </div>
            )}

            {status === "uploading" && (
              <div className="mt-6 text-center">
                <div className="mono text-xs text-neutral-500">Processing…</div>
                <div className="mt-2 h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full w-1/2 bg-klein animate-pulse-dot" />
                </div>
              </div>
            )}

            {status === "ready" && (
              <div data-testid="upload-ready" className="text-center py-6">
                <div className="mx-auto h-14 w-14 grid place-items-center bg-emerald-500/10 text-emerald-600 rounded-full"><CheckCircle size={28} weight="duotone" /></div>
                <div className="mt-4 font-display font-black text-3xl tracking-tighter">Database Ready</div>
                <div className="mono text-sm text-neutral-500 mt-1">{rows} students indexed</div>
                <div className="mt-6 flex gap-3 justify-center">
                  <Button data-testid="go-chat-btn" onClick={()=>nav("/app/chat")} className="bg-klein hover:bg-klein-dark text-white">Start asking questions →</Button>
                  <Button variant="outline" onClick={()=>nav("/app/dashboard")}>View dashboard</Button>
                </div>
              </div>
            )}

            {status === "idle" && file && (
              <div className="mt-6 flex justify-end">
                <Button data-testid="submit-upload-btn" onClick={onSubmit} className="bg-klein hover:bg-klein-dark text-white">Process file</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
