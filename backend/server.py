from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import io
import csv
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Admin config
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# Simple in-memory admin tokens (sufficient for this use case)
ADMIN_TOKENS: set[str] = set()

app = FastAPI(title="PAL Institute API")
api_router = APIRouter(prefix="/api")


# ---------- Helpers ----------
def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_admin(authorization: Optional[str] = Header(None)) -> bool:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.split(" ", 1)[1].strip()
    if token not in ADMIN_TOKENS:
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
async def root():
    return {"message": "PAL Institute API", "status": "ok"}


# ---------- Public Form Endpoints ----------
@api_router.post("/bookings")
async def create_booking(payload: DemoBookingCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    await db.demo_bookings.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/enquiries")
async def create_enquiry(payload: EnquiryCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    await db.enquiries.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/scholarship")
async def create_scholarship(payload: ScholarshipCreate):
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Please accept the consent, Terms & Conditions, and Privacy Policy to continue.",
        )
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = utcnow_iso()
    await db.scholarship_registrations.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/contact")
async def create_contact(payload: ContactCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    await db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.get("/toppers")
async def list_toppers():
    items = await db.toppers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


# ---------- Admin Auth ----------
@api_router.post("/admin/login")
async def admin_login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    token = secrets.token_urlsafe(32)
    ADMIN_TOKENS.add(token)
    return {"token": token}


@api_router.post("/admin/logout")
async def admin_logout(_: bool = Depends(require_admin), authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        ADMIN_TOKENS.discard(authorization.split(" ", 1)[1].strip())
    return {"success": True}


@api_router.get("/admin/verify")
async def admin_verify(_: bool = Depends(require_admin)):
    return {"valid": True}


# ---------- Admin Lists ----------
@api_router.get("/admin/bookings")
async def admin_list_bookings(_: bool = Depends(require_admin)):
    items = await db.demo_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api_router.patch("/admin/bookings/{item_id}/status")
async def admin_update_booking_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = await db.demo_bookings.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/enquiries")
async def admin_list_enquiries(_: bool = Depends(require_admin)):
    items = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api_router.patch("/admin/enquiries/{item_id}/status")
async def admin_update_enquiry_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = await db.enquiries.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/scholarship")
async def admin_list_scholarship(_: bool = Depends(require_admin)):
    items = await db.scholarship_registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api_router.get("/admin/contacts")
async def admin_list_contacts(_: bool = Depends(require_admin)):
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


# ---------- Admin Toppers / Results ----------
@api_router.post("/admin/toppers")
async def admin_create_topper(payload: TopperCreate, _: bool = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    await db.toppers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/toppers/{item_id}")
async def admin_delete_topper(item_id: str, _: bool = Depends(require_admin)):
    result = await db.toppers.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ---------- Admin Dashboard Stats ----------
@api_router.get("/admin/dashboard")
async def admin_dashboard(_: bool = Depends(require_admin)):
    bookings = await db.demo_bookings.find({}, {"_id": 0}).to_list(5000)
    enquiries = await db.enquiries.find({}, {"_id": 0}).to_list(5000)
    scholarship = await db.scholarship_registrations.find({}, {"_id": 0}).to_list(5000)

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
async def admin_export_csv(_: bool = Depends(require_admin)):
    bookings = await db.demo_bookings.find({}, {"_id": 0}).to_list(5000)
    enquiries = await db.enquiries.find({}, {"_id": 0}).to_list(5000)
    scholarship = await db.scholarship_registrations.find({}, {"_id": 0}).to_list(5000)

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
