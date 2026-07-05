from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import random
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date

import pandas as pd
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="EduChat AI")
api_router = APIRouter(prefix="/api")

# ---------------- Models ----------------

class LoginIn(BaseModel):
    email: str
    password: str
    role: str  # admin | teacher | principal

class ChatIn(BaseModel):
    session_id: str
    message: str

class SeedIn(BaseModel):
    count: int = 300

# ---------------- Demo data generator ----------------

FIRST_NAMES_M = ["Aarav","Vihaan","Aditya","Vivaan","Arjun","Sai","Reyansh","Krishna","Ishaan","Rohan","Kabir","Anish","Dev","Yash","Aryan","Kunal","Nikhil","Rahul","Karan","Manav"]
FIRST_NAMES_F = ["Aanya","Diya","Saanvi","Isha","Myra","Aadhya","Ananya","Riya","Pari","Kiara","Anika","Meera","Sara","Tara","Nisha","Priya","Kavya","Ira","Zara","Navya"]
LAST_NAMES = ["Sharma","Verma","Iyer","Reddy","Patel","Singh","Gupta","Nair","Kapoor","Mehta","Rao","Das","Bose","Khan","Kumar","Joshi","Chopra","Malhotra","Bansal","Agarwal"]
BUS_ROUTES = ["Route A - North","Route B - East","Route C - South","Route D - West","Route E - Central","No Transport"]
SECTIONS = ["A","B","C"]

def _mk_students(n: int) -> List[Dict[str, Any]]:
    out = []
    for i in range(n):
        gender = random.choice(["Male","Female"])
        fname = random.choice(FIRST_NAMES_M if gender=="Male" else FIRST_NAMES_F)
        lname = random.choice(LAST_NAMES)
        cls = random.randint(1,12)
        sec = random.choice(SECTIONS)
        roll = (i % 40) + 1
        att = round(random.uniform(55, 100), 1)
        maths = random.randint(35, 100)
        science = random.randint(35, 100)
        english = random.randint(40, 100)
        hindi = random.randint(40, 100)
        total_pct = round((maths+science+english+hindi)/4, 2)
        fees = random.choices(["Paid","Pending","Overdue"], weights=[70,20,10])[0]
        birth_year = 2026 - (cls + 5)
        dob = date(birth_year, random.randint(1,12), random.randint(1,28)).isoformat()
        father = f"Mr. {random.choice(LAST_NAMES)} {lname}"
        mother = f"Mrs. {random.choice(FIRST_NAMES_F)} {lname}"
        out.append({
            "id": str(uuid.uuid4()),
            "student_id": f"STU{1000+i}",
            "name": f"{fname} {lname}",
            "class": cls,
            "section": sec,
            "roll_number": roll,
            "father_name": father,
            "mother_name": mother,
            "mobile": f"+91-9{random.randint(100000000,999999999)}",
            "email": f"{fname.lower()}.{lname.lower()}{i}@school.edu",
            "dob": dob,
            "gender": gender,
            "attendance": att,
            "maths": maths,
            "science": science,
            "english": english,
            "hindi": hindi,
            "total_percentage": total_pct,
            "fees_status": fees,
            "bus_route": random.choice(BUS_ROUTES),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return out

_seeded = False

async def ensure_seed():
    global _seeded
    if _seeded:
        return
    count = await db.students.count_documents({})
    if count == 0:
        random.seed(42)
        docs = _mk_students(300)
        await db.students.insert_many(docs)
        await db.uploads.insert_one({
            "id": str(uuid.uuid4()),
            "filename": "demo_students_seed.xlsx",
            "rows": 300,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "seed": True
        })
    _seeded = True

# ---------------- Auth (demo) ----------------

DEMO_ACCOUNTS = {
    "admin@school.edu": {"password": "admin123", "role": "admin", "name": "Admin User"},
    "principal@school.edu": {"password": "principal123", "role": "principal", "name": "Dr. Priya Menon"},
    "teacher@school.edu": {"password": "teacher123", "role": "teacher", "name": "Rahul Sharma"},
}

@api_router.post("/auth/login")
async def login(inp: LoginIn):
    acc = DEMO_ACCOUNTS.get(inp.email.lower())
    if not acc or acc["password"] != inp.password:
        raise HTTPException(401, "Invalid credentials")
    if acc["role"] != inp.role:
        raise HTTPException(403, f"This account is a {acc['role']}, not {inp.role}")
    token = str(uuid.uuid4())
    return {"token": token, "user": {"email": inp.email, "role": acc["role"], "name": acc["name"]}}

@api_router.get("/auth/demo-accounts")
async def demo_accounts():
    return [
        {"email": e, "role": d["role"], "name": d["name"], "password": d["password"]}
        for e, d in DEMO_ACCOUNTS.items()
    ]

# ---------------- Students ----------------

@api_router.get("/students")
async def list_students(
    q: Optional[str] = None,
    class_: Optional[int] = Query(None, alias="class"),
    section: Optional[str] = None,
    gender: Optional[str] = None,
    fees_status: Optional[str] = None,
    limit: int = 500,
):
    await ensure_seed()
    query: Dict[str, Any] = {}
    if class_ is not None:
        query["class"] = class_
    if section:
        query["section"] = section
    if gender:
        query["gender"] = gender
    if fees_status:
        query["fees_status"] = fees_status
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"student_id": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    cur = db.students.find(query, {"_id": 0}).limit(limit)
    return await cur.to_list(length=limit)

@api_router.get("/students/{student_id}")
async def get_student(student_id: str):
    s = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Student not found")
    return s

# ---------------- Dashboard ----------------

@api_router.get("/dashboard")
async def dashboard():
    await ensure_seed()
    students = await db.students.find({}, {"_id": 0}).to_list(length=5000)
    total = len(students)
    if total == 0:
        return {"total": 0}
    avg_att = round(sum(s["attendance"] for s in students)/total, 1)
    avg_pct = round(sum(s["total_percentage"] for s in students)/total, 1)
    pending_fees = sum(1 for s in students if s["fees_status"] in ("Pending","Overdue"))
    classes = sorted({s["class"] for s in students})
    # class-wise performance
    class_perf = []
    for c in classes:
        cs = [s for s in students if s["class"]==c]
        class_perf.append({
            "class": c,
            "avg_percentage": round(sum(x["total_percentage"] for x in cs)/len(cs), 1),
            "avg_attendance": round(sum(x["attendance"] for x in cs)/len(cs), 1),
            "students": len(cs)
        })
    # attendance distribution
    buckets = {"<75%":0,"75-85%":0,"85-95%":0,"95%+":0}
    for s in students:
        a = s["attendance"]
        if a < 75: buckets["<75%"] += 1
        elif a < 85: buckets["75-85%"] += 1
        elif a < 95: buckets["85-95%"] += 1
        else: buckets["95%+"] += 1
    att_dist = [{"bucket":k,"count":v} for k,v in buckets.items()]
    # fees breakdown
    fees_break = {}
    for s in students:
        fees_break[s["fees_status"]] = fees_break.get(s["fees_status"], 0) + 1
    fees_data = [{"name":k,"value":v} for k,v in fees_break.items()]
    # top performers
    top = sorted(students, key=lambda x: -x["total_percentage"])[:10]
    # growth (fake by class as timeline surrogate)
    growth = [{"period": f"Class {c}", "students": sum(1 for s in students if s["class"]==c)} for c in classes]
    # recent uploads
    uploads = await db.uploads.find({}, {"_id": 0}).sort("uploaded_at", -1).limit(5).to_list(5)
    return {
        "total": total,
        "avg_attendance": avg_att,
        "avg_percentage": avg_pct,
        "pending_fees": pending_fees,
        "classes_count": len(classes),
        "teachers_count": 42,  # demo static
        "class_performance": class_perf,
        "attendance_distribution": att_dist,
        "fees_breakdown": fees_data,
        "top_performers": [{"name":s["name"],"class":s["class"],"section":s["section"],"total_percentage":s["total_percentage"],"student_id":s["student_id"]} for s in top],
        "growth": growth,
        "recent_uploads": uploads,
    }

# ---------------- Uploads ----------------

REQUIRED_MAP = {
    "student id": "student_id", "student_id": "student_id",
    "student name": "name", "name": "name",
    "class": "class",
    "section": "section",
    "roll number": "roll_number", "roll_number": "roll_number",
    "father's name": "father_name", "father name": "father_name",
    "mother's name": "mother_name", "mother name": "mother_name",
    "mobile number": "mobile", "mobile": "mobile",
    "email": "email",
    "date of birth": "dob", "dob": "dob",
    "gender": "gender",
    "attendance %": "attendance", "attendance": "attendance",
    "maths marks": "maths", "maths": "maths",
    "science marks": "science", "science": "science",
    "english marks": "english", "english": "english",
    "hindi marks": "hindi", "hindi": "hindi",
    "total percentage": "total_percentage",
    "fees status": "fees_status",
    "bus route": "bus_route",
}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), replace: bool = True):
    content = await file.read()
    name = (file.filename or "upload").lower()
    try:
        if name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {e}")

    # normalize columns
    df.columns = [str(c).strip().lower() for c in df.columns]
    renamed = {c: REQUIRED_MAP.get(c, c.replace(" ", "_")) for c in df.columns}
    df = df.rename(columns=renamed)

    docs = []
    for _, row in df.iterrows():
        d: Dict[str, Any] = {}
        for k, v in row.items():
            if pd.isna(v):
                d[k] = None
            elif isinstance(v, (pd.Timestamp,)):
                d[k] = v.date().isoformat()
            else:
                d[k] = v.item() if hasattr(v, "item") else v
        d["id"] = str(uuid.uuid4())
        if "student_id" not in d or not d["student_id"]:
            d["student_id"] = f"STU{random.randint(10000,99999)}"
        d["created_at"] = datetime.now(timezone.utc).isoformat()
        # numeric coercions
        for k in ("class","roll_number","maths","science","english","hindi"):
            if k in d and d[k] is not None:
                try: d[k] = int(float(d[k]))
                except Exception: pass
        for k in ("attendance","total_percentage"):
            if k in d and d[k] is not None:
                try: d[k] = float(d[k])
                except Exception: pass
        docs.append(d)

    if replace:
        await db.students.delete_many({})
    if docs:
        await db.students.insert_many(docs)

    up = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "rows": len(docs),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "seed": False,
    }
    await db.uploads.insert_one(up)
    up.pop("_id", None)
    return {"ok": True, "rows": len(docs), "upload": up}

@api_router.get("/uploads")
async def list_uploads():
    return await db.uploads.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(50)

# ---------------- Chat (SSE stream) ----------------

def _student_summary_json(students: List[Dict[str, Any]]) -> str:
    # Keep payload compact for LLM context
    trimmed = []
    for s in students[:400]:
        trimmed.append({
            "id": s.get("student_id"),
            "name": s.get("name"),
            "class": s.get("class"),
            "section": s.get("section"),
            "gender": s.get("gender"),
            "attendance": s.get("attendance"),
            "maths": s.get("maths"),
            "science": s.get("science"),
            "english": s.get("english"),
            "hindi": s.get("hindi"),
            "pct": s.get("total_percentage"),
            "fees": s.get("fees_status"),
            "bus": s.get("bus_route"),
            "dob": s.get("dob"),
        })
    return json.dumps(trimmed)

SYSTEM_PROMPT = """You are EduChat AI, an expert school data assistant. You help principals, teachers and administrators analyze student data.

You will be given a JSON dataset of students in the user's message context. Answer questions strictly using that dataset.

Response format rules:
- Start with a concise 1-2 sentence natural language answer.
- When listing multiple students, include a Markdown table with columns relevant to the question (name, class, section, and the metric asked).
- When giving statistics, provide crisp bullet points.
- For a single student, provide a clean profile summary.
- Never invent students not in the dataset.
- Be brief, professional, and data-driven. Use IBM/executive tone.
"""

@api_router.post("/chat/stream")
async def chat_stream(inp: ChatIn):
    await ensure_seed()
    students = await db.students.find({}, {"_id": 0}).to_list(length=5000)
    context = _student_summary_json(students)

    # Save user msg
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": inp.session_id,
        "role": "user",
        "content": inp.message,
        "ts": datetime.now(timezone.utc).isoformat(),
    })

    async def gen():
        assistant_text = ""
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=inp.session_id,
                system_message=SYSTEM_PROMPT,
            ).with_model("openai", "gpt-5.4-mini")

            prompt = f"""DATASET (JSON array of students):
{context}

USER QUESTION: {inp.message}

Answer using ONLY the dataset above."""
            um = UserMessage(text=prompt)
            async for ev in chat.stream_message(um):
                if isinstance(ev, TextDelta):
                    assistant_text += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            err = f"[Error contacting AI: {e}]"
            yield f"data: {json.dumps({'delta': err, 'error': True})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            assistant_text = err
        finally:
            await db.messages.insert_one({
                "id": str(uuid.uuid4()),
                "session_id": inp.session_id,
                "role": "assistant",
                "content": assistant_text,
                "ts": datetime.now(timezone.utc).isoformat(),
            })

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    msgs = await db.messages.find({"session_id": session_id}, {"_id": 0}).sort("ts", 1).to_list(500)
    return msgs

@api_router.get("/chat/sessions")
async def chat_sessions():
    pipeline = [
        {"$sort": {"ts": 1}},
        {"$group": {
            "_id": "$session_id",
            "first_message": {"$first": "$content"},
            "last_ts": {"$last": "$ts"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"last_ts": -1}},
        {"$limit": 30}
    ]
    cur = db.messages.aggregate(pipeline)
    out = []
    async for r in cur:
        out.append({
            "session_id": r["_id"],
            "title": (r["first_message"] or "")[:60],
            "last_ts": r["last_ts"],
            "count": r["count"],
        })
    return out

@api_router.delete("/chat/{session_id}")
async def delete_chat(session_id: str):
    await db.messages.delete_many({"session_id": session_id})
    return {"ok": True}

# ---------------- Seed / Reset ----------------

@api_router.post("/seed")
async def seed(inp: SeedIn):
    await db.students.delete_many({})
    docs = _mk_students(inp.count)
    await db.students.insert_many(docs)
    up = {
        "id": str(uuid.uuid4()),
        "filename": f"reseeded_{inp.count}.xlsx",
        "rows": inp.count,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "seed": True,
    }
    await db.uploads.insert_one(up)
    up.pop("_id", None)
    return {"ok": True, "count": inp.count}

@api_router.get("/")
async def root():
    return {"app": "EduChat AI", "status": "ready"}

# ---------------- App wiring ----------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_start():
    # Do not block startup on seeding — Atlas cold-start + 300 inserts can
    # exceed the readiness probe. Seeding happens lazily via ensure_seed()
    # inside data endpoints.
    logger.info("EduChat AI backend started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
