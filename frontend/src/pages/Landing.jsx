import { Link } from "react-router-dom";
import { ArrowRight, Sparkle, ChartBar, ChatCircle, Upload as UpIcon, Shield, Lightning } from "@phosphor-icons/react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Nav */}
      <nav className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-klein grid place-items-center rounded-sm">
              <Sparkle weight="fill" size={16} color="#fff" />
            </div>
            <span className="font-display font-black text-lg tracking-tight">Edu Chat</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-600 dark:text-neutral-400">
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white">Features</a>
            <a href="#how" className="hover:text-neutral-900 dark:hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-neutral-900 dark:hover:text-white">For Schools</a>
          </div>
          <div className="flex items-center gap-3">
            <Link data-testid="nav-login-link" to="/login" className="text-sm font-medium">Sign in</Link>
            <Link data-testid="nav-cta-btn" to="/login" className="bg-klein hover:bg-klein-dark text-white text-sm font-medium px-4 py-2 rounded-md transition-all duration-200">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mono border border-neutral-300 dark:border-neutral-700 px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-klein" /> Built for K-12 & Higher Ed
            </span>
            <h1 className="mt-6 font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tighter">
              Turn your Excel <br />
              into a <span className="text-klein">school intelligence</span> assistant.
            </h1>
            <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
              Upload student data once. Ask anything in plain English — attendance, marks, fees, transport, toppers.
              Edu Chat answers with tables, charts and profile cards. No formulas. No pivot tables.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link data-testid="hero-upload-btn" to="/login" className="bg-klein hover:bg-klein-dark text-white font-medium px-6 py-3 rounded-md inline-flex items-center gap-2 transition-all duration-200">
                <UpIcon size={18} weight="bold" /> Upload Student Data
              </Link>
              <a href="#features" className="border border-neutral-300 dark:border-neutral-700 hover:border-klein px-6 py-3 rounded-md inline-flex items-center gap-2 font-medium">
                See features <ArrowRight size={16} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs mono text-neutral-500">
              <div>SOC-friendly · GDPR-ready · Runs on your data</div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-signal" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs mono text-neutral-500">educhat.ai/chat</span>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="text-right"><span className="inline-block bg-neutral-100 dark:bg-neutral-800 rounded-md px-3 py-2">Who scored above 95% in Class 10?</span></div>
                <div className="text-neutral-800 dark:text-neutral-200">
                  <div className="mono text-xs text-neutral-500 mb-1">Edu Chat</div>
                  4 students in Class 10 scored above 95%.
                  <div className="mt-2 border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
                    <div className="grid grid-cols-3 mono text-xs bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="p-2">Name</div><div className="p-2">Section</div><div className="p-2 text-right">%</div>
                    </div>
                    {[["Aanya Sharma","A","98.2"],["Aditya Rao","B","97.6"],["Kavya Nair","A","96.4"],["Rohan Iyer","C","95.8"]].map((r,i)=>(
                      <div key={i} className="grid grid-cols-3 mono text-xs border-b last:border-b-0 border-neutral-200 dark:border-neutral-800">
                        <div className="p-2">{r[0]}</div><div className="p-2">{r[1]}</div><div className="p-2 text-right">{r[2]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full bg-klein rounded-lg hidden md:block" />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section id="features" className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
          {[
            {i: <ChatCircle size={22} weight="duotone" />, t: "Natural language queries", d: "Ask like you would ask a teacher. No SQL, no pivots."},
            {i: <ChartBar size={22} weight="duotone" />, t: "Dashboards in one click", d: "Attendance, fees, class performance — always up to date."},
            {i: <Shield size={22} weight="duotone" />, t: "Role-based access", d: "Admin, Principal and Teacher views out of the box."},
          ].map((f, idx)=>(
            <div key={idx} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg p-8 hover:-translate-y-1 transition-all duration-200">
              <div className="h-10 w-10 bg-klein/10 text-klein grid place-items-center rounded-md">{f.i}</div>
              <div className="mt-4 font-display font-bold text-xl">{f.t}</div>
              <div className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-6">
        {[
          {n:"01", t:"Upload", d:"Drop your .xlsx or .csv. We auto-detect columns like class, marks, attendance and fees."},
          {n:"02", t:"Ask", d:"Type your question. Get answers as cards, tables or charts — beautifully formatted."},
          {n:"03", t:"Act", d:"Export to PDF, Excel, or print in one click. Share with your team."},
        ].map((s,i)=>(
          <div key={i} className="border-l-2 border-klein pl-6">
            <div className="mono text-xs text-neutral-500">STEP {s.n}</div>
            <div className="font-display text-2xl font-extrabold mt-1">{s.t}</div>
            <div className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm">{s.d}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="mono text-xs uppercase tracking-widest text-klein">Free for pilot programs</div>
          <h2 className="mt-4 font-display font-black text-4xl md:text-5xl tracking-tighter">See it in action.</h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">Login as a principal, teacher or admin and try queries on a pre-loaded demo school of 300 students.</p>
          <Link data-testid="cta-try-demo-btn" to="/login" className="mt-8 inline-flex items-center gap-2 bg-klein hover:bg-klein-dark text-white px-6 py-3 rounded-md font-medium">
            <Lightning size={18} weight="fill" /> Try the demo
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between text-xs text-neutral-500 mono">
          <div>© 2026 EduChat AI · Built for Educators</div>
          <div>v1.0 · Preview</div>
        </div>
      </footer>
    </div>
  );
}
