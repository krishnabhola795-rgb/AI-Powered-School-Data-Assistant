import { useEffect, useState } from "react";
import { listUploads, seed } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileXls, ArrowClockwise, UploadSimple } from "@phosphor-icons/react";

export default function Files() {
  const nav = useNavigate();
  const [uploads, setUploads] = useState([]);
  const load = () => listUploads().then(setUploads);
  useEffect(() => { load(); }, []);

  const reset = async () => {
    await seed(300);
    toast.success("Demo data reset");
    load();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-neutral-500">Data Sources</div>
          <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter">Uploaded Files</h1>
        </div>
        <div className="flex gap-2">
          <Button data-testid="reset-demo-btn" variant="outline" onClick={reset}><ArrowClockwise size={14} className="mr-1" /> Reset demo</Button>
          <Button data-testid="upload-new-btn" onClick={()=>nav("/upload")} className="bg-klein hover:bg-klein-dark text-white"><UploadSimple size={14} className="mr-1" /> Upload new</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {uploads.length===0 && <div className="text-sm text-neutral-500">No uploads yet.</div>}
        {uploads.map((u) => (
          <Card key={u.id} className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-klein/10 text-klein rounded-md grid place-items-center"><FileXls size={20} weight="duotone" /></div>
                <div>
                  <div className="font-medium">{u.filename}</div>
                  <div className="mono text-xs text-neutral-500">{u.rows} rows · {new Date(u.uploaded_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-neutral-200 dark:border-neutral-800">
                {u.seed ? "Seed" : "Uploaded"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
