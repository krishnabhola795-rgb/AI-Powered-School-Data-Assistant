import { useEffect, useState } from "react";
import { getDashboard } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Users, CurrencyInr, ChalkboardTeacher, Percent, TrendUp, Trophy, Clock, ChartBar } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";

const CHART = ["#002FA7","#FF3B30","#10b981","#f59e0b","#7c3aed"];

function Metric({ icon: Icon, label, value, sub, testId }) {
  return (
    <div data-testid={testId} className="border border-neutral-200 dark:border-neutral-800 rounded-md p-5 bg-white dark:bg-neutral-900 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="mono text-xs uppercase tracking-widest text-neutral-500">{label}</div>
        <div className="h-8 w-8 grid place-items-center bg-klein/10 text-klein rounded-sm"><Icon size={16} weight="duotone" /></div>
      </div>
      <div className="mt-3 font-display font-black text-3xl tracking-tighter">{value}</div>
      {sub && <div className="mt-1 mono text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { getDashboard().then(setD); }, []);

  if (!d) return <div className="p-10 mono text-sm text-neutral-500">Loading dashboard…</div>;

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-neutral-500">Control Room</div>
          <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter">Dashboard</h1>
        </div>
        <Link to="/upload" data-testid="upload-shortcut-btn" className="bg-klein hover:bg-klein-dark text-white text-sm px-4 py-2 rounded-md">Upload new file</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric testId="metric-total-students" icon={Users} label="Total Students" value={d.total} sub={`Across ${d.classes_count} classes`} />
        <Metric testId="metric-teachers" icon={ChalkboardTeacher} label="Teachers" value={d.teachers_count} sub="Faculty on record" />
        <Metric testId="metric-attendance" icon={Percent} label="Avg Attendance" value={`${d.avg_attendance}%`} sub="Trailing 30 days" />
        <Metric testId="metric-pending-fees" icon={CurrencyInr} label="Pending Fees" value={d.pending_fees} sub="Students with dues" />
        <Metric testId="metric-avg-percentage" icon={TrendUp} label="Avg Performance" value={`${d.avg_percentage}%`} sub="Across all classes" />
        <Metric testId="metric-classes" icon={ChartBar} label="Classes" value={d.classes_count} sub="Class 1 – Class 12" />
        <Metric testId="metric-top-performer" icon={Trophy} label="Top Performer" value={d.top_performers?.[0]?.total_percentage + "%" || "—"} sub={d.top_performers?.[0]?.name} />
        <Metric testId="metric-recent-uploads" icon={Clock} label="Uploads" value={d.recent_uploads?.length || 0} sub="Recent files" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="mono text-xs uppercase tracking-widest text-neutral-500">Class-wise Performance</div>
                <div className="font-display font-bold text-xl">Average % per class</div>
              </div>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={d.class_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="class" tick={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <YAxis tick={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <Tooltip contentStyle={{ borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="avg_percentage" fill="#002FA7" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="mono text-xs uppercase tracking-widest text-neutral-500">Fee Collection</div>
            <div className="font-display font-bold text-xl mb-4">Status breakdown</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={d.fees_breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {d.fees_breakdown.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 text-xs mono mt-2">
              {d.fees_breakdown.map((f, i) => (
                <div key={f.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART[i%CHART.length] }} />{f.name}: {f.value}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="mono text-xs uppercase tracking-widest text-neutral-500">Attendance Distribution</div>
            <div className="font-display font-bold text-xl mb-4">Students per bucket</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={d.attendance_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <YAxis tick={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF3B30" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="mono text-xs uppercase tracking-widest text-neutral-500">Top Performers</div>
            <div className="font-display font-bold text-xl mb-3">Leaderboard</div>
            <div className="space-y-2">
              {d.top_performers.slice(0,6).map((s, i) => (
                <div key={s.student_id} className="flex items-center justify-between text-sm border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="mono text-xs w-5 text-neutral-500">#{i+1}</div>
                    <div className="font-medium">{s.name}</div>
                  </div>
                  <div className="mono text-xs text-klein">{s.total_percentage}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="mono text-xs uppercase tracking-widest text-neutral-500">Student Growth</div>
            <div className="font-display font-bold text-xl mb-4">Enrollment by class</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={d.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                  <YAxis tick={{ fontSize: 12, fontFamily: "IBM Plex Mono" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#002FA7" strokeWidth={2} dot={{ r: 3, fill: "#002FA7" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
