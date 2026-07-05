import { useEffect, useMemo, useState } from "react";
import { getStudents } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { MagnifyingGlass, Export, Printer } from "@phosphor-icons/react";
import { exportCSV, exportPDF, printTable } from "../lib/export";

const CLASSES = ["all", ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
const SECTIONS = ["all","A","B","C"];
const GENDERS = ["all","Male","Female"];
const FEES = ["all","Paid","Pending","Overdue"];

export default function Students() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("all");
  const [sec, setSec] = useState("all");
  const [gen, setGen] = useState("all");
  const [fees, setFees] = useState("all");

  const load = async () => {
    setLoading(true);
    const params = { limit: 500 };
    if (q) params.q = q;
    if (cls !== "all") params.class = cls;
    if (sec !== "all") params.section = sec;
    if (gen !== "all") params.gender = gen;
    if (fees !== "all") params.fees_status = fees;
    const data = await getStudents(params);
    setRows(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [cls, sec, gen, fees]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);

  const columns = [
    { key: "student_id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "class", label: "Class" },
    { key: "section", label: "Sec" },
    { key: "gender", label: "Gender" },
    { key: "attendance", label: "Attendance%" },
    { key: "total_percentage", label: "Overall%" },
    { key: "fees_status", label: "Fees" },
    { key: "mobile", label: "Contact" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-neutral-500">Directory</div>
          <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter">Student Database</h1>
          <div className="mono text-xs text-neutral-500 mt-1">{rows.length} students</div>
        </div>
        <div className="flex gap-2">
          <Button data-testid="export-csv-btn" variant="outline" onClick={() => exportCSV("students.csv", rows, columns)}><Export size={14} className="mr-1" /> Excel</Button>
          <Button data-testid="export-pdf-btn" variant="outline" onClick={() => exportPDF("students.pdf", "Student Database", rows, columns)}><Export size={14} className="mr-1" /> PDF</Button>
          <Button data-testid="print-btn" variant="outline" onClick={() => printTable("Student Database", rows, columns)}><Printer size={14} className="mr-1" /> Print</Button>
        </div>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 mb-4">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input data-testid="search-input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, id, email…" className="pl-9" />
          </div>
          <FilterSelect testId="filter-class" value={cls} onChange={setCls} options={CLASSES.map(c=>({label: c==="all"?"All classes":`Class ${c}`, value:c}))} />
          <FilterSelect testId="filter-section" value={sec} onChange={setSec} options={SECTIONS.map(c=>({label: c==="all"?"All sections":`Section ${c}`, value:c}))} />
          <FilterSelect testId="filter-gender" value={gen} onChange={setGen} options={GENDERS.map(c=>({label: c==="all"?"All genders":c, value:c}))} />
          <FilterSelect testId="filter-fees" value={fees} onChange={setFees} options={FEES.map(c=>({label: c==="all"?"All fees":c, value:c}))} />
        </CardContent>
      </Card>

      <Card className="border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
              <tr>{columns.map(c => <th key={c.key} className="text-left px-4 py-3 mono text-[11px] uppercase tracking-widest text-neutral-500">{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-6 text-center text-neutral-500 mono text-xs" colSpan={columns.length}>Loading…</td></tr>}
              {!loading && rows.length===0 && <tr><td className="p-6 text-center text-neutral-500" colSpan={columns.length}>No students match your filters.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id || r.student_id} className="border-b last:border-b-0 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
                  <td className="px-4 py-2 mono text-xs">{r.student_id}</td>
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 mono">{r.class}</td>
                  <td className="px-4 py-2 mono">{r.section}</td>
                  <td className="px-4 py-2">{r.gender}</td>
                  <td className="px-4 py-2 mono">{r.attendance}%</td>
                  <td className="px-4 py-2 mono text-klein">{r.total_percentage}%</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.fees_status==="Paid"?"bg-emerald-500/10 text-emerald-600":r.fees_status==="Pending"?"bg-amber-500/10 text-amber-600":"bg-signal/10 text-signal"}`}>{r.fees_status}</span>
                  </td>
                  <td className="px-4 py-2 mono text-xs text-neutral-500">{r.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({ testId, value, onChange, options }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
