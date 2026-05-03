"""
PAL Institute API — FastAPI app.

Resilient boot:
- All environment variable reads use ``os.getenv`` with fallbacks.
- Missing ``MONGO_URI`` logs a clear warning but does NOT crash the
  process. The server still boots so the host (Render / PA / Vercel)
  can stream logs and the operator can see what's wrong.
- MongoDB connection is created lazily on first use, so a transient
  Atlas outage at boot time doesn't kill the worker.
- Startup events are wrapped to log full tracebacks instead of failing
  silently.
"""
import os
import sys
import logging
import traceback
import io
import csv
import time
import uuid
from pathlib import Path
from typing import Optional, Literal
from datetime import datetime, timezone

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# ------------------------------------------------------------------
# Logging — go to stderr so Render / PA / supervisor capture it.
# ------------------------------------------------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("pal-institute")

# ------------------------------------------------------------------
# Env loading
# ------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "pal_institute")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "pal-institute-default-secret-change-in-production",
)
JWT_ALG = "HS256"

if not MONGO_URI:
    # Loud warning but no crash. Health check / first DB call will surface
    # the same problem at runtime with a 503 instead of bringing down the
    # whole web service.
    logger.warning(
        "\n%s\n"
        "MONGO_URI is not set. The API will boot but every database call "
        "will fail until you add MONGO_URI to your environment.\n"
        "Example (MongoDB Atlas):\n"
        "  MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/"
        "pal_institute?retryWrites=true&w=majority\n%s",
        "=" * 70,
        "=" * 70,
    )

# ------------------------------------------------------------------
# Lazy MongoDB connection
# ------------------------------------------------------------------
_mongo_client: Optional[MongoClient] = None


def get_db():
    """Return the active database. Creates the client on first call.

    A connection failure here surfaces as an HTTPException(503) at the
    request boundary instead of crashing the worker.
    """
    global _mongo_client
    if not MONGO_URI:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. MONGO_URI environment variable is missing.",
        )
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=int(os.getenv("MONGO_TIMEOUT_MS", "10000")),
            )
            logger.info("MongoDB client created (db=%s)", DB_NAME)
        except PyMongoError as exc:
            logger.exception("Failed to create MongoDB client: %s", exc)
            raise HTTPException(status_code=503, detail="Database connection failed.")
    return _mongo_client[DB_NAME]


# ------------------------------------------------------------------
# App + auth
# ------------------------------------------------------------------
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


# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------
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


# ------------------------------------------------------------------
# Health
# ------------------------------------------------------------------
@api_router.get("/")
def root():
    return {"message": "PAL Institute API", "status": "ok"}


@api_router.get("/health")
def health():
    """Liveness + DB readiness probe.

    Always returns 200 so Render's health-check doesn't kill the service
    when MongoDB is temporarily unreachable. The body indicates DB state.
    """
    info = {
        "status": "ok",
        "service": "pal-institute-api",
        "mongo_uri_configured": bool(MONGO_URI),
        "db_name": DB_NAME,
    }
    if not MONGO_URI:
        info["db"] = "not_configured"
        return JSONResponse(info, status_code=200)
    try:
        # Force a real round-trip to verify Atlas reachability.
        client = _mongo_client or MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        info["db"] = "connected"
    except Exception as exc:  # noqa: BLE001
        logger.warning("DB health check failed: %s", exc)
        info["db"] = "error"
        info["db_error"] = str(exc)[:200]
    return JSONResponse(info, status_code=200)


# ------------------------------------------------------------------
# Public form endpoints
# ------------------------------------------------------------------
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
    get_db().demo_bookings.insert_one(doc)
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
    get_db().enquiries.insert_one(doc)
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
    get_db().scholarship_registrations.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.post("/contact")
def create_contact(payload: ContactCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    get_db().contact_messages.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "id": doc["id"]}


@api_router.get("/toppers")
def list_toppers():
    return list(get_db().toppers.find({}, {"_id": 0}).sort("created_at", -1).limit(500))


# ------------------------------------------------------------------
# Admin auth
# ------------------------------------------------------------------
@api_router.post("/admin/login")
def admin_login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"token": issue_admin_token()}


@api_router.post("/admin/logout")
def admin_logout(_: bool = Depends(require_admin)):
    return {"success": True}


@api_router.get("/admin/verify")
def admin_verify(_: bool = Depends(require_admin)):
    return {"valid": True}


# ------------------------------------------------------------------
# Admin lists
# ------------------------------------------------------------------
@api_router.get("/admin/bookings")
def admin_list_bookings(_: bool = Depends(require_admin)):
    return list(get_db().demo_bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.patch("/admin/bookings/{item_id}/status")
def admin_update_booking_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = get_db().demo_bookings.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/enquiries")
def admin_list_enquiries(_: bool = Depends(require_admin)):
    return list(get_db().enquiries.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.patch("/admin/enquiries/{item_id}/status")
def admin_update_enquiry_status(item_id: str, payload: StatusUpdate, _: bool = Depends(require_admin)):
    result = get_db().enquiries.update_one({"id": item_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/admin/scholarship")
def admin_list_scholarship(_: bool = Depends(require_admin)):
    return list(get_db().scholarship_registrations.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


@api_router.get("/admin/contacts")
def admin_list_contacts(_: bool = Depends(require_admin)):
    return list(get_db().contact_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(2000))


# ------------------------------------------------------------------
# Admin toppers
# ------------------------------------------------------------------
@api_router.post("/admin/toppers")
def admin_create_topper(payload: TopperCreate, _: bool = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = utcnow_iso()
    get_db().toppers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/toppers/{item_id}")
def admin_delete_topper(item_id: str, _: bool = Depends(require_admin)):
    result = get_db().toppers.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ------------------------------------------------------------------
# Admin dashboard
# ------------------------------------------------------------------
@api_router.get("/admin/dashboard")
def admin_dashboard(_: bool = Depends(require_admin)):
    db_ = get_db()
    bookings = list(db_.demo_bookings.find({}, {"_id": 0}))
    enquiries = list(db_.enquiries.find({}, {"_id": 0}))
    scholarship = list(db_.scholarship_registrations.find({}, {"_id": 0}))

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


# ------------------------------------------------------------------
# Admin CSV export
# ------------------------------------------------------------------
@api_router.get("/admin/export/csv")
def admin_export_csv(_: bool = Depends(require_admin)):
    db_ = get_db()
    bookings = list(db_.demo_bookings.find({}, {"_id": 0}))
    enquiries = list(db_.enquiries.find({}, {"_id": 0}))
    scholarship = list(db_.scholarship_registrations.find({}, {"_id": 0}))

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


# ------------------------------------------------------------------
# CORS
#
# Two-layer policy that is safe for both local dev and production:
#   1. `allow_origins`        — comes from the CORS_ORIGINS env var
#                                (comma-separated list, or "*" wildcard).
#   2. `allow_origin_regex`  — always-on safety net that lets the
#                                Vercel preview/prod domains, Render
#                                domains, the Emergent preview host
#                                and localhost reach the API even if
#                                someone misconfigures CORS_ORIGINS.
#
# `allow_credentials=True` is enabled in all cases. Starlette's
# CORSMiddleware will echo the actual request Origin header (instead of
# the literal "*") when both wildcard and credentials are allowed, so
# this is spec-compliant and does not break browser auth flows.
# ------------------------------------------------------------------
_cors = os.getenv("CORS_ORIGINS", "*").strip()
# When CORS_ORIGINS is "*" (or unset) we deliberately leave the explicit
# allow_origins list EMPTY and rely on the regex below. This is required
# because Starlette suppresses the `Access-Control-Allow-Credentials`
# header whenever the literal string "*" is present in `allow_origins`.
# The regex still matches every legitimate deployment surface.
if _cors == "*" or not _cors:
    allowed_origins: list[str] = []
else:
    allowed_origins = [o.strip() for o in _cors.split(",") if o.strip()]

# Regex fallback for production deployments. Matches:
#   • http(s)://localhost or 127.0.0.1 (any port) — local dev
#   • https://*.vercel.app — Vercel previews + production
#   • https://*.onrender.com — Render frontends (if any)
#   • https://*.emergentagent.com — Emergent preview hosts
_cors_regex = (
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    r"|^https://([a-z0-9-]+\.)*vercel\.app$"
    r"|^https://([a-z0-9-]+\.)*onrender\.com$"
    r"|^https://([a-z0-9-]+\.)*emergentagent\.com$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# ------------------------------------------------------------------
# Startup / shutdown — wrapped so any exception is logged with traceback
# instead of silently killing the worker.
# ------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    try:
        logger.info("PAL Institute API starting up")
        logger.info("  PYTHON     : %s", sys.version.split()[0])
        logger.info("  CWD        : %s", Path.cwd())
        logger.info("  MONGO_URI  : %s", "set" if MONGO_URI else "MISSING")
        logger.info("  DB_NAME    : %s", DB_NAME)
        logger.info("  CORS       : %s", allowed_origins)
        logger.info("  JWT_SECRET : %s", "default (CHANGE IT)" if JWT_SECRET.startswith("pal-institute-default") else "set")
    except Exception:  # noqa: BLE001
        logger.error("Startup hook failed:\n%s", traceback.format_exc())


@app.on_event("shutdown")
def on_shutdown():
    global _mongo_client
    if _mongo_client is not None:
        try:
            _mongo_client.close()
            logger.info("MongoDB client closed")
        except Exception:  # noqa: BLE001
            logger.error("Shutdown hook failed:\n%s", traceback.format_exc())
        _mongo_client = None
