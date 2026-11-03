Edu Chat: AI-Powered School Data Assistant

Ask questions about your school's data in plain English and get instant answers with tables and insights. Built for principals, teachers, and administrators who want answers without digging through spreadsheets.

Live demo: https://ai-powered-school-data-assistant.vercel.app Backend API: https://edu-chat-backend-iwhx.onrender.com/api/

The backend runs on a free plan and sleeps when idle. The first request can take about 50 seconds to wake it up.

What it does
AI chat: ask things like "Who has the highest percentage in Class 10?" or "Which students have attendance below 75%?" and get streaming answers with Markdown tables.
Dashboard: class-wise performance, attendance distribution, fees status, and top performers.
Upload your data: import student records from an Excel or CSV file.
Student search: filter by class, section, gender, and fees status.
Demo login: separate accounts for admin, principal, and teacher.
Screenshots

Add 2-3 screenshots here (dashboard, chat, upload page).

![Dashboard](screenshots/dashboard.png)
![Chat](screenshots/chat.png)
Tech stack
Part	Technology
Frontend	React, Tailwind CSS, Recharts
Backend	Python, FastAPI
Database	MongoDB Atlas (Motor async driver)
AI	Google Gemini API (gemini-3.8-flash)
Hosting	Vercel (frontend), Render (backend)
How it works
The user asks a question in the chat.
The backend loads the student data from MongoDB.
The data and the question are sent to Gemini, with instructions to answer only from the dataset.
The answer streams back to the browser word by word (Server-Sent Events).
Run locally
Backend
bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in your own values
uvicorn server:app --reload

Open http://localhost:8000/api/ and you should see {"app":"Edu Chat","status":"ready"}.

Environment variables (backend/.env):

Variable	Description
MONGO_URL	MongoDB Atlas connection string
DB_NAME	Database name, for example edu_chat
GEMINI_API_KEY	Free key from Google AI Studio
GEMINI_MODEL	Gemini model ID, for example gemini-3.8-flash
CORS_ORIGINS	Your frontend URL (use * only for local testing)
Frontend
bash
cd frontend
npm install
npm start

Create frontend/.env with:

REACT_APP_BACKEND_URL=http://localhost:8000
Deployment
Backend (Render): root directory backend, build command pip install -r requirements.txt, start command uvicorn server:app --host 0.0.0.0 --port $PORT. Add the environment variables above.
Frontend (Vercel): set REACT_APP_BACKEND_URL to your Render URL (no trailing slash), then redeploy.
Demo accounts
Role	Email	Password
Admin	admin@school.edu	admin123
Principal	principal@school.edu	principal123
Teacher	teacher@school.edu	teacher123
Known limitations
The login is for demo only. Passwords are hard-coded and routes are not protected, so do not use real student data.
The first 400 student records are sent to the AI for each question. Very large schools would need a smarter approach, such as querying the database first.
The free Render plan has cold starts (slow first load).
What I learned
Moving an app away from a no-code AI builder: replacing hidden services (database, AI key, hosting) with my own.
Streaming AI responses from FastAPI to a React frontend.
Deploying a full-stack app across Vercel, Render, and MongoDB Atlas.
Author

Krishna | B.Tech CSE student, AI education creator Instagram, YouTube: @krishnabhola26
