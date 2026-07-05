import { useEffect, useState } from "react";
import { getDashboard, getStudents } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Export, Printer } from "@phosphor-icons/react";
import { exportCSV, exportPDF, printTable } from "../lib/export";

export default function Reports() {
  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [low, setLow] = useState([]);

  useEffect(() => {
    getDashboard().then(setD);
    getStudents({ fees_status: "Pending", limit: 500 }).then(setPending);
    getStudents({ limit: 500 }).then((all) => setLow(all.filter(s => (s.attendance || 0) < 75)));
  }, []);

  const perfCols = [{ key:"class", label:"Class" }, { key:"avg_percentage", label:"Avg %" }, { key:"avg_attendance", label:"Avg Att%" }, { key:"students", label:"Students" }];
  const pendCols = [{ key:"student_id", label:"ID" }, { key:"name", label:"Name" }, { key:"class", label:"Class" }, { key:"section", label:"Sec" }, { key:"mobile", label:"Contact" }];
  const lowCols  = [{ key:"student_id", label:"ID" }, { key:"name", label:"Name" }, { key:"class", label:"Class" }, { key:"attendance", label:"Att%" }];

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <div className="mono text-xs uppercase tracking-widest text-neutral-500">Executive summary</div>
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter">Reports</h1>
      </div>

      {d && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-display font-extrabold text-2xl">Class Performance Report</div>
              <div className="text-sm text-neutral-500">Average performance and attendance per class</div>
            </div>
            <div className="flex gap-2">
              <Button data-testid="report-perf-csv" variant="outline" onClick={()=>exportCSV("class_performance.xlsx", d.class_performance, perfCols)}><Export size={14} className="mr-1" /> Excel</Button>
              <Button data-testid="report-perf-pdf" variant="outline" onClick={()=>exportPDF("class_performance.pdf","Class Performance", d.class_performance, perfCols)}><Export size={14} className="mr-1" /> PDF</Button>
              <Button data-testid="report-perf-print" variant="outline" onClick={()=>printTable("Class Performance", d.class_performance, perfCols)}><Printer size={14} className="mr-1" /> Print</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-display font-extrabold text-2xl">Pending Fees Report</div>
            <div className="text-sm text-neutral-500">{pending.length} students with pending fees</div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="report-fees-csv" variant="outline" onClick={()=>exportCSV("pending_fees.xlsx", pending, pendCols)}><Export size={14} className="mr-1" /> Excel</Button>
            <Button data-testid="report-fees-pdf" variant="outline" onClick={()=>exportPDF("pending_fees.pdf","Pending Fees", pending, pendCols)}><Export size={14} className="mr-1" /> PDF</Button>
            <Button data-testid="report-fees-print" variant="outline" onClick={()=>printTable("Pending Fees", pending, pendCols)}><Printer size={14} className="mr-1" /> Print</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-display font-extrabold text-2xl">Low Attendance Report</div>
            <div className="text-sm text-neutral-500">{low.length} students below 75% attendance</div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="report-att-csv" variant="outline" onClick={()=>exportCSV("low_attendance.xlsx", low, lowCols)}><Export size={14} className="mr-1" /> Excel</Button>
            <Button data-testid="report-att-pdf" variant="outline" onClick={()=>exportPDF("low_attendance.pdf","Low Attendance", low, lowCols)}><Export size={14} className="mr-1" /> PDF</Button>
            <Button data-testid="report-att-print" variant="outline" onClick={()=>printTable("Low Attendance", low, lowCols)}><Printer size={14} className="mr-1" /> Print</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
