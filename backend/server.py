"""
PAL Institute API — FastAPI app.

Runs as ASGI under uvicorn (local dev / Emergent supervisor) and as WSGI
under PythonAnywhere via wsgi.py (uses a2wsgi adapter).

Routes are sync (def, not async def) and use pymongo so the same code
works in both ASGI and WSGI environments without event-loop conflicts.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import sys
import logging
import io
import csv
import time
import uuid
import jwt
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- MongoDB ----------
# Prefer MONGO_URI (Atlas / production). Fall back to MONGO_URL (local dev).
MONGO_URI = os.environ.get("MONGO_URI") or os.environ.get("MONGO_URL")
if not MONGO_URI:
    # Print a loud, human-readable message before raising so it shows up
    # in Render / PythonAnywhere / Vercel logs at process boot.
    sys.stderr.write(
        "\n" + "=" * 70 + "\n"
        "FATAL: MONGO_URI is not set.\n"
        "Add it to your hosting provider's environment variables.\n"
        "Example (MongoDB Atlas):\n"
        "  MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/"
        "pal_institute?retryWrites=true&w=majority\n"
        + "=" * 70 + "\n"
    )
    sys.stderr.flush()
    raise RuntimeError("MONGO_URI (or MONGO_URL) must be set in environment.")

DB_NAME = os.environ.get("DB_NAME", "pal_institute")

# serverSelectionTimeoutMS keeps boot fast even if Atlas is slow to respond.
mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = mongo_client[DB_NAME]

# ---------- Admin auth (stateless JWT) ----------
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "pal-institute-default-secret-change-in-production",
)
JWT_ALG = "HS256"

# ---------- App ----------
app = FastAPI(title="PAL Institute API")
api_router = APIRouter(prefix="/api")


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def issue_admin_token() -> str:
    payload = {"role": "admin", "iat": int(time.time())}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def require_admin(authorization: Optional[str] = Header(None)) -> bool:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Invalid admin token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


# ---------- Models ----------
class DemoBookingCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_name: str
    parent_name: str
    phone: str
    email: Optional[str] = ""
    student_class: str
    program: str
    preferred_date: str
    preferred_timing: str
    source: str
    questions: Optional[str] = ""
    consent: bool


class EnquiryCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_name: str
    parent_name: str
    phone: str
    email: Optional[str] = ""
    student_class: str
    program: str
    source: str
    message: Optional[str] = ""
    consent: bool


class ScholarshipCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_name: str
    parent_name: str
    phone: str
    email: Optional[str] = ""
    student_class: str
    program: str
    consent: bool


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    phone: str
    email: Optional[str] = ""
    message: str


class StatusUpdate(BaseModel):
    status: Literal["New", "Called", "Demo Done", "Enrolled", "Not Interested"]


class TopperCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    photo: Optional[str] = ""
    exam: str
    rank: str
    year: str


class LoginRequest(BaseModel):
    password: str


# ---------- Health ----------
@api_router.get("/")
def root():
    return {"message": "PAL Institute API", "status": "ok"}


@api_router.get("/health")
def health():
    try:
        mongo_client.admin.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "degraded", "db": "error", "detail": str(e)}


# ---------- Public Form Endpoints ----------
@api_router.post("/bookings")
def create_booking(payload: DemoBookingCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    db.demo_bookings.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/enquiries")
def create_enquiry(payload: EnquiryCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    db.enquiries.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/scholarship")
def create_scholarship(payload: ScholarshipCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    db.scholarship_registrations.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/contact")
def create_contact(payload: ContactCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.get("/toppers")
def list_toppers():
    return list(db.toppers.find({}, {"_id": 0}).sort("created_at", -1).limit(500))


# ---------- Admin Auth ----------
@api_router.post("/admin/login")
def admin_login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"token": issue_admin_token()}


@api_router.post("/admin/logout")
def admin_logout(_: bool = Depends(require_admin)):
    # Stateless JWT: client just discards the token.
    return {"success": True}


@api_router.get("/admin/verify")
def admin_verify(_: bool = Depends(require_admin)):
    return {"valid": True}


# ---------- Admin Lists ----------
@api_router.get("/admin/bookings")
def admin_list_bookings(_: bool = Depends(require_admin)):
    return list(db.demo_bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.patch("/admin/bookings/{item_id}/status")
def admin_update_booking_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = db.demo_bookings.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/enquiries")
def admin_list_enquiries(_: bool = Depends(require_admin)):
    return list(db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.patch("/admin/enquiries/{item_id}/status")
def admin_update_enquiry_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = db.enquiries.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/scholarship")
def admin_list_scholarship(_: bool = Depends(require_admin)):
    return list(db.scholarship_registrations.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.get("/admin/contacts")
def admin_list_contacts(_: bool = Depends(require_admin)):
    return list(db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


# ---------- Admin Toppers / Results ----------
@api_router.post("/admin/toppers")
def admin_create_topper(payload: TopperCreate, _: bool = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    db.toppers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/toppers/{item_id}")
def admin_delete_topper(item_id: str, _: bool = Depends(require_admin)):
    result = db.toppers.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ---------- Admin Dashboard ----------
@api_router.get("/admin/dashboard")
def admin_dashboard(_: bool = Depends(require_admin)):
    bookings = list(db.demo_bookings.find({}, {"_id": 0}))
    enquiries = list(db.enquiries.find({}, {"_id": 0}))
    scholarship = list(db.scholarship_registrations.find({}, {"_id": 0}))

    from collections import Counter

    now = datetime.now(timezone.utc)

    def parse_dt(s: str):
        try:
            return datetime.fromisoformat(s)
        except Exception:
            return now

    all_leads = [{**b, "type": "booking"} for b in bookings] + [{**e, "type": "enquiry"} for e in enquiries]

    week_count = 0
    month_count = 0
    for lead in all_leads:
        dt = parse_dt(lead.get("created_at", ""))
        diff = (now - dt).days
        if diff <= 7:
            week_count += 1
        if diff <= 30:
            month_count += 1

    by_program = Counter(lead.get("program", "Other") for lead in all_leads)
    by_source = Counter(lead.get("source", "Other") for lead in all_leads)
    by_status = Counter(lead.get("status", "New") for lead in all_leads)

    return {
        "total_enquiries": len(enquiries),
        "total_bookings": len(bookings),
        "total_scholarship": len(scholarship),
        "total_leads": len(all_leads),
        "leads_this_week": week_count,
        "leads_this_month": month_count,
        "by_program": [{"name": k, "value": v} for k, v in by_program.items()],
        "by_source": [{"name": k, "value": v} for k, v in by_source.items()],
        "by_status": [{"name": k, "value": v} for k, v in by_status.items()],
    }


# ---------- Admin CSV Export ----------
@api_router.get("/admin/export/csv")
def admin_export_csv(_: bool = Depends(require_admin)):
    bookings = list(db.demo_bookings.find({}, {"_id": 0}))
    enquiries = list(db.enquiries.find({}, {"_id": 0}))
    scholarship = list(db.scholarship_registrations.find({}, {"_id": 0}))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "type", "id", "student_name", "parent_name", "phone", "email",
        "student_class", "program", "preferred_date", "preferred_timing",
        "source", "status", "consent", "message", "created_at",
    ])
    for item in [{**b, "type": "booking"} for b in bookings]:
        writer.writerow([
            item.get("type", ""), item.get("id", ""), item.get("student_name", ""),
            item.get("parent_name", ""), item.get("phone", ""), item.get("email", ""),
            item.get("student_class", ""), item.get("program", ""),
            item.get("preferred_date", ""), item.get("preferred_timing", ""),
            item.get("source", ""), item.get("status", ""),
            item.get("consent", ""), item.get("questions", ""), item.get("created_at", ""),
        ])
    for item in [{**e, "type": "enquiry"} for e in enquiries]:
        writer.writerow([
            item.get("type", ""), item.get("id", ""), item.get("student_name", ""),
            item.get("parent_name", ""), item.get("phone", ""), item.get("email", ""),
            item.get("student_class", ""), item.get("program", ""),
            "", "", item.get("source", ""), item.get("status", ""),
            item.get("consent", ""), item.get("message", ""), item.get("created_at", ""),
        ])
    for item in [{**s, "type": "scholarship"} for s in scholarship]:
        writer.writerow([
            item.get("type", ""), item.get("id", ""), item.get("student_name", ""),
            item.get("parent_name", ""), item.get("phone", ""), item.get("email", ""),
            item.get("student_class", ""), item.get("program", ""),
            "", "", "", item.get("status", ""),
            item.get("consent", ""), "", item.get("created_at", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pal_leads_export.csv"},
    )


app.include_router(api_router)

# ---------- CORS ----------
# CORS_ORIGINS env: comma-separated list of allowed origins.
# Use "*" to allow all (fine for this public marketing site).
_cors = os.environ.get("CORS_ORIGINS", "*").strip()
allowed_origins = ["*"] if _cors == "*" else [o.strip() for o in _cors.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False if allowed_origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
def shutdown_db_client():
    mongo_client.close()
