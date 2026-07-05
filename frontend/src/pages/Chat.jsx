import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { streamChat, getChatHistory, getChatSessions } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { PaperPlaneTilt, Sparkle, ChatCircleDots, Plus, Clock } from "@phosphor-icons/react";
import { renderMarkdown } from "../lib/markdown";

const SUGGESTIONS = [
  "Show all students in Class 8",
  "List students who scored above 90%",
  "Who has attendance below 75%?",
  "Which students have pending fees?",
  "Show girls in Class 10",
  "How many students are in each class?",
  "Generate a topper list",
  "Who scored highest in Science?",
];

function newId() { return Math.random().toString(36).slice(2, 10); }

export default function Chat() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [sid, setSid] = useState(sessionId || newId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessions, setSessions] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      setSid(sessionId);
      getChatHistory(sessionId).then((h)=>{
        setMessages(h.map(m => ({ role: m.role, content: m.content })));
      });
    } else {
      setSid(newId());
      setMessages([]);
    }
  }, [sessionId]);

  useEffect(() => { getChatSessions().then(setSessions).catch(()=>{}); }, [streaming]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);
    let acc = "";
    await streamChat({
      sessionId: sid,
      message: q,
      onDelta: (d) => {
        acc += d;
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      },
      onDone: () => setStreaming(false),
      onError: () => setStreaming(false),
    });
  };

  const newChat = () => {
    const id = newId();
    setSid(id);
    setMessages([]);
    nav(`/app/chat/${id}`);
  };

  return (
    <div className="flex h-screen">
      {/* Recent chats */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col shrink-0">
        <div className="p-4">
          <Button data-testid="new-chat-btn" onClick={newChat} className="w-full bg-klein hover:bg-klein-dark text-white"><Plus size={14} className="mr-1" /> New chat</Button>
        </div>
        <div className="px-3 mono text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-1"><Clock size={10} /> Recent</div>
        <div className="p-2 space-y-1 overflow-y-auto thin-scroll">
          {sessions.length === 0 && <div className="text-xs text-neutral-500 p-2">No history yet.</div>}
          {sessions.map((s) => (
            <button
              key={s.session_id}
              onClick={() => nav(`/app/chat/${s.session_id}`)}
              className={`w-full text-left text-xs px-3 py-2 rounded-md truncate transition-all duration-150 ${s.session_id===sid?"bg-klein/10 text-klein":"hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
              data-testid={`session-${s.session_id}`}
            >
              {s.title || "Untitled"}
            </button>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-6 justify-between">
          <div>
            <div className="mono text-xs uppercase tracking-widest text-neutral-500">AI Chat</div>
            <div className="font-display font-black text-lg tracking-tight">Ask about your school</div>
          </div>
        </div>

        <div data-testid="chat-messages" className="flex-1 overflow-y-auto thin-scroll">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {messages.length === 0 && <EmptyState onPick={send} />}
            <div className="space-y-6">
              {messages.map((m, i) => (
                <Message key={i} role={m.role} content={m.content} streaming={streaming && i===messages.length-1 && m.role==="assistant"} />
              ))}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 border border-neutral-300 dark:border-neutral-700 rounded-md p-2 bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-klein transition-all duration-150">
              <textarea
                data-testid="chat-input"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
                placeholder="Ask anything about your school data..."
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none text-sm max-h-40 py-2 px-2"
              />
              <Button data-testid="send-btn" onClick={()=>send()} disabled={streaming || !input.trim()} className="bg-klein hover:bg-klein-dark text-white h-9 w-9 p-0">
                <PaperPlaneTilt size={16} weight="fill" />
              </Button>
            </div>
            <div className="mono text-[10px] text-neutral-500 mt-2 text-center">EduChat AI can make mistakes · Always verify critical decisions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }) {
  return (
    <div data-testid="chat-empty" className="text-center py-10">
      <div className="mx-auto h-14 w-14 bg-klein/10 text-klein grid place-items-center rounded-md"><Sparkle size={26} weight="fill" /></div>
      <h2 className="mt-5 font-display font-black text-3xl tracking-tighter">Ask anything about your school</h2>
      <p className="mt-2 text-sm text-neutral-500">Try one of these suggestions to get started.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            data-testid={`suggestion-${i}`}
            onClick={()=>onPick(s)}
            className="border border-neutral-200 dark:border-neutral-800 hover:border-klein rounded-md px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-klein/5 transition-all duration-200"
          >
            <ChatCircleDots size={14} className="inline mr-2 text-klein" weight="duotone" />{s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ role, content, streaming }) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] bg-neutral-100 dark:bg-neutral-800 rounded-md px-4 py-2 text-sm">{content}</div>
      </div>
    );
  }
  return (
    <div className="animate-fade-up">
      <div className="mono text-[10px] uppercase tracking-widest text-klein mb-2 flex items-center gap-1"><Sparkle size={10} weight="fill" /> EduChat AI</div>
      <div className="chat-markdown text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      {streaming && (
        <div className="mt-2 text-klein"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
      )}
    </div>
  );
}
