import { useEffect, useState } from "react";
import { api, adminApi, API } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Lock, Loader2, LogOut, Download, Trash2, Plus, Home,
  Users, BookOpen, GraduationCap, CalendarDays, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_OPTIONS = ["New", "Called", "Demo Done", "Enrolled", "Not Interested"];
const PIE_COLORS = ["#1B2A4A", "#FFD700", "#5A6A91", "#E6BF00", "#8E99B5", "#B39200"];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("pal_admin_token") || "");
  const [checking, setChecking] = useState(!!token);

  useEffect(() => {
    const t = localStorage.getItem("pal_admin_token");
    if (!t) {
      setChecking(false);
      return;
    }
    adminApi
      .get("/admin/verify")
      .then(() => {
        setToken(t);
        setChecking(false);
      })
      .catch(() => {
        localStorage.removeItem("pal_admin_token");
        setToken("");
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-alt">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!token) return <Login onSuccess={(t) => setToken(t)} />;
  return <Dashboard onLogout={() => { localStorage.removeItem("pal_admin_token"); setToken(""); }} />;
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await api.post("/admin/login", { password });
      localStorage.setItem("pal_admin_token", res.data.token);
      onSuccess(res.data.token);
      toast.success("Welcome back!");
    } catch (ex) {
      // Distinguish auth failure vs network/CORS/config errors so users
      // don't think the password is wrong when really the backend is unreachable.
      const status = ex?.response?.status;
      if (status === 401) {
        setErr("Invalid password. Please try again.");
      } else if (status) {
        setErr(`Server error (HTTP ${status}). Please try again.`);
      } else {
        // Network error, CORS block, or REACT_APP_BACKEND_URL not set on the host.
        const url = process.env.REACT_APP_BACKEND_URL || "(not set)";
        // eslint-disable-next-line no-console
        console.error("[admin login] network error", { backendUrl: url, error: ex });
        setErr(
          `Cannot reach backend at ${url}. ` +
          `Check REACT_APP_BACKEND_URL on the host and that the backend allows this origin (CORS_ORIGINS).`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm"
      >
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-navy" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-navy text-center mb-1">Admin Panel</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter the admin password to continue.
        </p>
        <input
          data-testid="admin-password-input"
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
          autoFocus
        />
        {err && <p className="text-xs text-red-600 mb-2 leading-relaxed" data-testid="admin-login-error">{err}</p>}
        <button
          data-testid="admin-login-btn"
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Log In
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground mt-4 hover:text-navy">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [scholarship, setScholarship] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, b, e, sc, t] = await Promise.all([
        adminApi.get("/admin/dashboard"),
        adminApi.get("/admin/bookings"),
        adminApi.get("/admin/enquiries"),
        adminApi.get("/admin/scholarship"),
        api.get("/toppers"),
      ]);
      setStats(s.data);
      setBookings(b.data);
      setEnquiries(e.data);
      setScholarship(sc.data);
      setToppers(t.data);
    } catch (ex) {
      const status = ex?.response?.status;
      if (status === 401) {
        // Token rejected → kick back to login.
        localStorage.removeItem("pal_admin_token");
        toast.error("Session expired. Please log in again.");
        window.location.reload();
      } else if (status) {
        toast.error(`Failed to load data (HTTP ${status})`);
      } else {
        const url = process.env.REACT_APP_BACKEND_URL || "(not set)";
        // eslint-disable-next-line no-console
        console.error("[admin] network error", { backendUrl: url, error: ex });
        toast.error(`Cannot reach backend (${url}). Check REACT_APP_BACKEND_URL & CORS.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const exportCsv = async () => {
    try {
      const res = await adminApi.get("/admin/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "pal_leads_export.csv";
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* Topbar */}
      <header className="bg-navy text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gold text-navy font-heading font-bold text-sm">P</span>
            <div>
              <h1 className="font-heading font-bold text-sm md:text-base">PAL Admin</h1>
              <p className="text-xs text-white/60 hidden sm:block">Leads & Results Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="hidden sm:inline-flex items-center gap-1 text-xs border border-white/20 px-3 py-1.5 rounded hover:bg-white/10"
              data-testid="admin-refresh-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link to="/" className="text-xs flex items-center gap-1 text-white/80 hover:text-gold">
              <Home className="w-3.5 h-3.5" /> Site
            </Link>
            <button
              onClick={onLogout}
              data-testid="admin-logout-btn"
              className="inline-flex items-center gap-1 text-xs bg-gold text-navy font-medium px-3 py-1.5 rounded hover:bg-gold-200"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {[
            { k: "overview", l: "Overview", icon: BookOpen },
            { k: "bookings", l: `Demo Bookings (${bookings.length})`, icon: CalendarDays },
            { k: "enquiries", l: `Enquiries (${enquiries.length})`, icon: Users },
            { k: "scholarship", l: `Scholarship (${scholarship.length})`, icon: GraduationCap },
            { k: "toppers", l: "Results Manager", icon: GraduationCap },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              data-testid={`admin-tab-${t.k}`}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition ${
                tab === t.k ? "border-gold text-gold" : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {t.l}
            </button>
          ))}
          <div className="ml-auto py-1.5">
            <button
              onClick={exportCsv}
              data-testid="admin-export-csv-btn"
              className="hidden md:inline-flex items-center gap-1 text-xs bg-white/10 text-white px-3 py-1.5 rounded hover:bg-white/20"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === "overview" && <Overview stats={stats} bookings={bookings} />}
        {tab === "bookings" && (
          <LeadTable
            testid="bookings-table"
            items={bookings}
            onStatusChange={async (id, status) => {
              try {
                await adminApi.patch(`/admin/bookings/${id}/status`, { status });
                setBookings((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
                toast.success("Status updated");
              } catch {
                toast.error("Update failed");
              }
            }}
            columns={["Student", "Parent", "Phone", "Class", "Program", "Demo Date", "Timing", "Source", "Status"]}
            rowCells={(x) => [
              x.student_name,
              x.parent_name,
              `+91 ${x.phone}`,
              x.student_class,
              x.program,
              x.preferred_date,
              x.preferred_timing,
              x.source,
            ]}
          />
        )}
        {tab === "enquiries" && (
          <LeadTable
            testid="enquiries-table"
            items={enquiries}
            onStatusChange={async (id, status) => {
              try {
                await adminApi.patch(`/admin/enquiries/${id}/status`, { status });
                setEnquiries((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
                toast.success("Status updated");
              } catch {
                toast.error("Update failed");
              }
            }}
            columns={["Student", "Parent", "Phone", "Class", "Program", "Source", "Status"]}
            rowCells={(x) => [
              x.student_name,
              x.parent_name,
              `+91 ${x.phone}`,
              x.student_class,
              x.program,
              x.source,
            ]}
          />
        )}
        {tab === "scholarship" && (
          <LeadTable
            testid="scholarship-table"
            items={scholarship}
            noStatus
            columns={["Student", "Parent", "Phone", "Class", "Program", "Email"]}
            rowCells={(x) => [
              x.student_name,
              x.parent_name,
              `+91 ${x.phone}`,
              x.student_class,
              x.program,
              x.email || "—",
            ]}
          />
        )}
        {tab === "toppers" && <ToppersManager items={toppers} onChange={refresh} />}
      </main>
    </div>
  );
}

function Overview({ stats, bookings }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-navy" />
      </div>
    );
  }

  const cards = [
    { l: "Total Leads", v: stats.total_leads, c: "bg-navy text-white" },
    { l: "This Week", v: stats.leads_this_week, c: "bg-gold text-navy" },
    { l: "This Month", v: stats.leads_this_month, c: "bg-white text-navy border border-gray-200" },
    { l: "Demo Bookings", v: stats.total_bookings, c: "bg-white text-navy border border-gray-200" },
    { l: "Enquiries", v: stats.total_enquiries, c: "bg-white text-navy border border-gray-200" },
    { l: "Scholarship", v: stats.total_scholarship, c: "bg-white text-navy border border-gray-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.l} className={`rounded-xl p-4 ${c.c}`}>
            <div className="text-xs opacity-80 uppercase tracking-wider">{c.l}</div>
            <div className="font-heading text-2xl md:text-3xl font-bold mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Leads by Program">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.by_program}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={(e) => `${e.name}: ${e.value}`}
              >
                {stats.by_program.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Leads by Source">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.by_source}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1B2A4A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Upcoming Demo Bookings">
        <ul className="divide-y divide-gray-100">
          {bookings
            .filter((b) => b.preferred_date && new Date(b.preferred_date) >= new Date(new Date().toDateString()))
            .slice(0, 8)
            .map((b) => (
              <li key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-navy">{b.student_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.program} · {b.preferred_timing}
                  </div>
                </div>
                <div className="text-xs text-navy font-mono bg-bg-alt px-2 py-1 rounded">
                  {b.preferred_date}
                </div>
              </li>
            ))}
          {bookings.filter((b) => b.preferred_date && new Date(b.preferred_date) >= new Date(new Date().toDateString())).length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">No upcoming bookings</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5">
      <h3 className="font-heading text-base font-semibold text-navy mb-3">{title}</h3>
      {children}
    </div>
  );
}

function LeadTable({ items, onStatusChange, columns, rowCells, noStatus, testid }) {
  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-muted-foreground">
        No entries yet.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid={testid}>
          <thead className="bg-bg-alt text-navy">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-heading font-semibold px-3 py-2.5 whitespace-nowrap">
                  {c}
                </th>
              ))}
              <th className="text-left font-heading font-semibold px-3 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((x) => (
              <tr key={x.id} className="hover:bg-bg-alt/40" data-testid={`row-${x.id}`}>
                {rowCells(x).map((cell, i) => (
                  <td key={i} className="px-3 py-2.5 text-ink/90 whitespace-nowrap">{cell}</td>
                ))}
                {!noStatus && (
                  <td className="px-3 py-2.5">
                    <select
                      data-testid={`status-select-${x.id}`}
                      value={x.status || "New"}
                      onChange={(e) => onStatusChange(x.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {x.created_at ? new Date(x.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToppersManager({ items, onChange }) {
  const [form, setForm] = useState({ name: "", exam: "", rank: "", year: "", photo: "" });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.name || !form.exam || !form.rank || !form.year) {
      toast.error("Fill name, exam, rank, year");
      return;
    }
    setBusy(true);
    try {
      await adminApi.post("/admin/toppers", form);
      toast.success("Topper added");
      setForm({ name: "", exam: "", rank: "", year: "", photo: "" });
      onChange();
    } catch {
      toast.error("Add failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this topper?")) return;
    try {
      await adminApi.delete(`/admin/toppers/${id}`);
      toast.success("Deleted");
      onChange();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5">
        <h3 className="font-heading text-base font-semibold text-navy mb-3">Add Topper</h3>
        <form onSubmit={add} className="grid md:grid-cols-5 gap-3" data-testid="topper-form">
          <input className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Name" data-testid="topper-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <input className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Exam (e.g. JEE)" data-testid="topper-exam" value={form.exam} onChange={(e) => set("exam", e.target.value)} />
          <input className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Rank / %" data-testid="topper-rank" value={form.rank} onChange={(e) => set("rank", e.target.value)} />
          <input className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Year" data-testid="topper-year" value={form.year} onChange={(e) => set("year", e.target.value)} />
          <input className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Photo URL (optional)" value={form.photo} onChange={(e) => set("photo", e.target.value)} />
          <button
            type="submit"
            disabled={busy}
            data-testid="topper-add-btn"
            className="md:col-span-5 inline-flex items-center justify-center gap-2 bg-navy text-white font-medium py-2 rounded hover:bg-navy-600 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Topper
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-alt text-navy">
              <tr>
                <th className="text-left font-heading font-semibold px-3 py-2.5">Name</th>
                <th className="text-left font-heading font-semibold px-3 py-2.5">Exam</th>
                <th className="text-left font-heading font-semibold px-3 py-2.5">Rank/%</th>
                <th className="text-left font-heading font-semibold px-3 py-2.5">Year</th>
                <th className="text-left font-heading font-semibold px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2.5 font-medium text-navy">{t.name}</td>
                  <td className="px-3 py-2.5">{t.exam}</td>
                  <td className="px-3 py-2.5">{t.rank}</td>
                  <td className="px-3 py-2.5">{t.year}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => del(t.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs"
                      data-testid={`topper-delete-${t.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">
                    No toppers added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
