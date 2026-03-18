"use client";

import { useEffect, useMemo, useState } from "react";

type League = { min: number; max: number; name: string; color: string; text: string };
type Rule = { text: string; icon: string };
type User = { id: string; name: string; email: string; password: string; role: "admin" | "user" };
type Task = { id: string; date: string; task: string; points: number; approved: boolean; createdBy?: string };
type Session = { userId: string; email: string; role: "admin" | "user"; loginAt: string } | null;

const LEAGUES: League[] = [
  { min: 0, max: 499, name: "Demir", color: "#334155", text: "#ffffff" },
  { min: 500, max: 999, name: "Bronz", color: "#b45309", text: "#ffffff" },
  { min: 1000, max: 1999, name: "Gümüş", color: "#71717a", text: "#ffffff" },
  { min: 2000, max: 3499, name: "Altın", color: "#facc15", text: "#111827" },
  { min: 3500, max: 5499, name: "Platin", color: "#06b6d4", text: "#ffffff" },
  { min: 5500, max: 7999, name: "Elmas", color: "#0284c7", text: "#ffffff" },
  { min: 8000, max: 10999, name: "Ustalık", color: "#7c3aed", text: "#ffffff" },
  { min: 11000, max: 14999, name: "Büyük Ustalık", color: "#c026d3", text: "#ffffff" },
  { min: 15000, max: Number.POSITIVE_INFINITY, name: "Challenger", color: "#e11d48", text: "#ffffff" },
];

const RULES: Rule[] = [
  { text: "Günlük 100 puanın altına düşülürse -100 ceza uygulanır.", icon: "⚠️" },
  { text: "Üst üste 100+ günlerde streak oluşur ve +50 bonus kazanılır.", icon: "🔥" },
  { text: "Her kullanıcı kendi görevini ekler ve puan verir.", icon: "📝" },
  { text: "Tek bir görev 100 puanı geçemez.", icon: "⛔" },
  { text: "Haftalık sıralama son 7 güne göre hesaplanır.", icon: "📅" },
  { text: "Genel sıralama toplam puana göre belirlenir.", icon: "🏆" },
];

const DEFAULT_USERS: User[] = [
  { id: "U001", name: "Mehmet Kaya", email: "mehmet@example.com", password: "123456", role: "admin" },
  { id: "U002", name: "Ayşe Demir", email: "ayse@example.com", password: "123456", role: "user" },
  { id: "U003", name: "Ali Yılmaz", email: "ali@example.com", password: "123456", role: "user" },
  { id: "U004", name: "Zeynep Arslan", email: "zeynep@example.com", password: "123456", role: "user" },
  { id: "U005", name: "Can Efe", email: "can@example.com", password: "123456", role: "user" },
];

const DEFAULT_TASKS: Record<string, Task[]> = {
  U001: [
    { id: "t1", date: "2026-03-15", task: "Matematik soru çözümü", points: 80, approved: true, createdBy: "Mehmet Kaya" },
    { id: "t2", date: "2026-03-15", task: "Paragraf çalışması", points: 30, approved: true, createdBy: "Mehmet Kaya" },
    { id: "t3", date: "2026-03-16", task: "TYT deneme analizi", points: 95, approved: true, createdBy: "Mehmet Kaya" },
    { id: "t4", date: "2026-03-16", task: "Eksik konu tekrarı", points: 20, approved: true, createdBy: "Mehmet Kaya" },
    { id: "t5", date: "2026-03-17", task: "Fizik tekrar", points: 70, approved: true, createdBy: "Mehmet Kaya" },
  ],
  U002: [
    { id: "t6", date: "2026-03-15", task: "Geometri kampı", points: 100, approved: true, createdBy: "Ayşe Demir" },
    { id: "t7", date: "2026-03-16", task: "AYT biyoloji not çıkarma", points: 100, approved: true, createdBy: "Ayşe Demir" },
    { id: "t8", date: "2026-03-17", task: "Kimya soru bankası", points: 100, approved: true, createdBy: "Ayşe Demir" },
  ],
  U003: [
    { id: "t9", date: "2026-03-16", task: "Türkçe deneme", points: 60, approved: true, createdBy: "Ali Yılmaz" },
    { id: "t10", date: "2026-03-17", task: "Tarih tekrar", points: 45, approved: true, createdBy: "Ali Yılmaz" },
  ],
  U004: [
    { id: "t11", date: "2026-03-16", task: "Geometri tekrar", points: 55, approved: true, createdBy: "Zeynep Arslan" },
    { id: "t12", date: "2026-03-17", task: "Paragraf denemesi", points: 75, approved: true, createdBy: "Zeynep Arslan" },
  ],
  U005: [{ id: "t13", date: "2026-03-17", task: "Fizik soru çözümü", points: 100, approved: true, createdBy: "Can Efe" }],
};

const STORAGE_KEYS = {
  users: "lig_users_v2",
  tasks: "lig_tasks_v2",
  session: "lig_session_v2",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function seedIfNeeded() {
  if (!readStorage<User[] | null>(STORAGE_KEYS.users, null)) saveStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  if (!readStorage<Record<string, Task[]> | null>(STORAGE_KEYS.tasks, null)) saveStorage(STORAGE_KEYS.tasks, DEFAULT_TASKS);
}

function getLeague(total: number) {
  return LEAGUES.find((l) => total >= l.min && total <= l.max) ?? LEAGUES[0];
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function clampTaskPoints(points: number | string) {
  return Math.min(100, Math.max(0, Number(points) || 0));
}

function sortDatesAsc(dates: string[]) {
  return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

function calculateUserDailySummary(tasks: Task[] = []) {
  const approved = tasks.filter((t) => t.approved);
  const grouped = approved.reduce<Record<string, number>>((acc, task) => {
    if (!task.date) return acc;
    acc[task.date] = (acc[task.date] || 0) + clampTaskPoints(task.points);
    return acc;
  }, {});

  const dates = sortDatesAsc(Object.keys(grouped));
  let runningTotal = 0;
  let streak = 0;

  return dates.map((date) => {
    const dailyPoints = grouped[date] || 0;
    const passed = dailyPoints >= 100;
    streak = passed ? streak + 1 : 0;
    const penalty = passed ? 0 : 100;
    const bonus = streak >= 2 ? 50 : 0;
    runningTotal = runningTotal + dailyPoints + bonus - penalty;

    return {
      date,
      dailyPoints,
      streak,
      penalty,
      bonus,
      totalPoints: runningTotal,
      league: getLeague(runningTotal).name,
    };
  });
}

function badgeStyle(leagueName: string) {
  const league = LEAGUES.find((item) => item.name === leagueName) ?? LEAGUES[0];
  return { background: league.color, color: league.text };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    outline: "none",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
}

export default function Page() {
  const [booted, setBooted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasksByUser, setTasksByUser] = useState<Record<string, Task[]>>({});
  const [session, setSession] = useState<Session>(null);
  const [selectedUser, setSelectedUser] = useState("U001");
  const [tab, setTab] = useState("dashboard");
  const [form, setForm] = useState({ date: "2026-03-18", task: "", points: "", approved: "E" });
  const [loginForm, setLoginForm] = useState({ email: "mehmet@example.com", password: "123456" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    seedIfNeeded();
    const loadedUsers = readStorage<User[]>(STORAGE_KEYS.users, DEFAULT_USERS);
    const loadedTasks = readStorage<Record<string, Task[]>>(STORAGE_KEYS.tasks, DEFAULT_TASKS);
    const loadedSession = readStorage<Session>(STORAGE_KEYS.session, null);
    setUsers(loadedUsers);
    setTasksByUser(loadedTasks);
    setSession(loadedSession);
    setSelectedUser(loadedSession?.userId || loadedUsers[0]?.id || "U001");
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    saveStorage(STORAGE_KEYS.users, users);
  }, [users, booted]);

  useEffect(() => {
    if (!booted) return;
    saveStorage(STORAGE_KEYS.tasks, tasksByUser);
  }, [tasksByUser, booted]);

  useEffect(() => {
    if (!booted) return;
    saveStorage(STORAGE_KEYS.session, session);
  }, [session, booted]);

  const stats = useMemo(() => {
    const list = users.map((user) => {
      const tasks = tasksByUser[user.id] || [];
      const summary = calculateUserDailySummary(tasks);
      const last = summary[summary.length - 1];
      const weeklyPoints = summary.slice(-7).reduce((sum, d) => sum + d.dailyPoints, 0);
      return {
        ...user,
        tasks,
        summary,
        totalPoints: last?.totalPoints || 0,
        league: last?.league || "Demir",
        weeklyPoints,
        streak: last?.streak || 0,
        totalApprovedTasks: tasks.filter((t) => t.approved).length,
      };
    });

    const generalSorted = [...list].sort((a, b) => b.totalPoints - a.totalPoints || a.id.localeCompare(b.id));
    const weeklySorted = [...list].sort((a, b) => b.weeklyPoints - a.weeklyPoints || a.id.localeCompare(b.id));

    return list.map((item) => ({
      ...item,
      generalRank: generalSorted.findIndex((u) => u.id === item.id) + 1,
      weeklyRank: weeklySorted.findIndex((u) => u.id === item.id) + 1,
    }));
  }, [users, tasksByUser]);

  const leaderboard = useMemo(() => [...stats].sort((a, b) => a.generalRank - b.generalRank), [stats]);
  const weeklyBoard = useMemo(() => [...stats].sort((a, b) => a.weeklyRank - b.weeklyRank), [stats]);
  const currentUser = stats.find((u) => u.id === session?.userId) || null;
  const isAdmin = currentUser?.role === "admin";
  const visibleUsers = isAdmin ? stats : stats.filter((u) => u.id === currentUser?.id);
  const effectiveSelectedUser = isAdmin ? selectedUser : currentUser?.id;
  const activeUser = stats.find((u) => u.id === effectiveSelectedUser) || stats[0];
  const activeRawTasks = tasksByUser[effectiveSelectedUser || ""] || [];

  const totals = useMemo(() => {
    const allTasks = Object.values(tasksByUser).flat();
    return {
      totalUsers: users.length,
      totalTasks: allTasks.length,
      approvedTasks: allTasks.filter((t) => t.approved).length,
      avgScore: Math.round(stats.reduce((sum, u) => sum + u.totalPoints, 0) / Math.max(stats.length, 1)),
    };
  }, [users, tasksByUser, stats]);

  function login() {
    const found = users.find(
      (u) => u.email.trim().toLowerCase() === loginForm.email.trim().toLowerCase() && u.password === loginForm.password,
    );
    if (!found) {
      setAuthError("E-posta veya şifre hatalı.");
      return;
    }
    setAuthError("");
    setSession({ userId: found.id, email: found.email, role: found.role, loginAt: new Date().toISOString() });
    setSelectedUser(found.id);
  }

  function register() {
    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password.trim();
    if (!name || !email || !password) {
      setAuthError("Lütfen tüm alanları doldur.");
      return;
    }
    if (users.some((u) => u.email.trim().toLowerCase() === email)) {
      setAuthError("Bu e-posta zaten kayıtlı.");
      return;
    }
    const newId = `U${String(users.length + 1).padStart(3, "0")}`;
    const newUser: User = { id: newId, name, email, password, role: "user" };
    setUsers((prev) => [...prev, newUser]);
    setTasksByUser((prev) => ({ ...prev, [newId]: [] }));
    setSession({ userId: newId, email, role: "user", loginAt: new Date().toISOString() });
    setSelectedUser(newId);
    setRegisterForm({ name: "", email: "", password: "" });
    setAuthError("");
  }

  function logout() {
    setSession(null);
  }

  function addTask() {
    const targetUserId = effectiveSelectedUser;
    if (!targetUserId || !form.task.trim() || !form.date) return;
    const newTask: Task = {
      id: `${targetUserId}-${Date.now()}`,
      date: form.date,
      task: form.task,
      points: clampTaskPoints(form.points),
      approved: isAdmin ? form.approved === "E" : true,
      createdBy: currentUser?.name || "Sistem",
    };
    setTasksByUser((prev) => ({
      ...prev,
      [targetUserId]: [...(prev[targetUserId] || []), newTask],
    }));
    setForm((f) => ({ ...f, task: "", points: "", approved: "E" }));
  }

  function updateUserName(userId: string, name: string) {
    if (!isAdmin && currentUser?.id !== userId) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, name } : u)));
  }

  if (!booted) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Yükleniyor...</div>;
  }

  if (!session) {
    return (
      <main style={{ minHeight: "100vh", padding: 24, background: "linear-gradient(135deg, #f3f4f6, #ffffff, #eff6ff)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", minHeight: "85vh", display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center" }}>
          <section>
            <div style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, marginBottom: 16 }}>
              Ders Ligi • Giriş Sistemi
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: 0 }}>Gerçek kullanıcı verisiyle çalışan giriş ekranı</h1>
            <p style={{ fontSize: 18, color: "#4b5563", maxWidth: 640 }}>
              Kullanıcı oturumu, hesap kaydı ve görev verileri tarayıcıda kalıcı olarak saklanır. Admin tüm sistemi görür, normal kullanıcı sadece kendi panelini görür.
            </p>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 20 }}>
              {[
                ["🔐", "Güvenli giriş", "E-posta ve şifre ile giriş yap."],
                ["💾", "Kalıcı veri", "Kullanıcılar ve görevler localStorage ile korunur."],
                ["🛡️", "Rol yönetimi", "Admin ve normal kullanıcı görünümü ayrıdır."],
                ["✨", "Hazır demo", "Demo admin hesabı ile tüm sistemi test edebilirsin."],
              ].map(([icon, title, text]) => (
                <div key={title} style={{ ...cardStyle(), padding: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{icon} {title}</div>
                  <div style={{ color: "#4b5563", fontSize: 14 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle(), padding: 20, marginTop: 20, background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <div style={{ fontWeight: 700, color: "#1e3a8a" }}>Demo giriş bilgisi</div>
              <div style={{ marginTop: 6 }}>E-posta: <code>mehmet@example.com</code></div>
              <div>Şifre: <code>123456</code></div>
            </div>
          </section>

          <section style={{ ...cardStyle(), padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#f3f4f6", padding: 6, borderRadius: 18, marginBottom: 20 }}>
              <button onClick={() => { setAuthMode("login"); setAuthError(""); }} style={{ padding: "12px 16px", borderRadius: 14, border: 0, background: authMode === "login" ? "#ffffff" : "transparent", boxShadow: authMode === "login" ? "0 1px 2px rgba(0,0,0,0.08)" : "none", fontWeight: 700, cursor: "pointer" }}>Giriş</button>
              <button onClick={() => { setAuthMode("register"); setAuthError(""); }} style={{ padding: "12px 16px", borderRadius: 14, border: 0, background: authMode === "register" ? "#ffffff" : "transparent", boxShadow: authMode === "register" ? "0 1px 2px rgba(0,0,0,0.08)" : "none", fontWeight: 700, cursor: "pointer" }}>Kayıt Ol</button>
            </div>

            {authMode === "login" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>E-posta</div>
                  <input style={inputStyle()} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>Şifre</div>
                  <input type="password" style={inputStyle()} value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                {authError ? <div style={{ padding: 12, borderRadius: 14, background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}>{authError}</div> : null}
                <button onClick={login} style={{ border: 0, borderRadius: 14, background: "#111827", color: "#ffffff", padding: "14px 18px", fontWeight: 700, cursor: "pointer" }}>Giriş Yap</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>Ad Soyad</div>
                  <input style={inputStyle()} value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>E-posta</div>
                  <input style={inputStyle()} value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>Şifre</div>
                  <input type="password" style={inputStyle()} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>
                {authError ? <div style={{ padding: 12, borderRadius: 14, background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}>{authError}</div> : null}
                <button onClick={register} style={{ border: 0, borderRadius: 14, background: "#2563eb", color: "#ffffff", padding: "14px 18px", fontWeight: 700, cursor: "pointer" }}>Kayıt Ol</button>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1.3fr) minmax(300px,0.7fr)", marginBottom: 24 }}>
          <section style={{ ...cardStyle(), padding: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>Ders Ligi Yönetim Paneli</div>
                <div style={{ color: "#4b5563", marginTop: 6 }}>Giriş sistemi, rol yönetimi ve kalıcı kullanıcı verisi eklenmiş sürüm.</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <span style={{ padding: "8px 12px", borderRadius: 999, fontWeight: 700, background: isAdmin ? "#7c3aed" : "#059669", color: "#ffffff" }}>{isAdmin ? "Admin" : "Kullanıcı"}</span>
                <div style={{ padding: "10px 14px", borderRadius: 18, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <div style={{ fontWeight: 700 }}>{currentUser?.name}</div>
                  <div style={{ color: "#6b7280", fontSize: 14 }}>{currentUser?.email}</div>
                </div>
                <button onClick={logout} style={{ borderRadius: 14, border: "1px solid #d1d5db", background: "#ffffff", padding: "12px 14px", cursor: "pointer", fontWeight: 700 }}>Çıkış</button>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", marginTop: 20 }}>
              {[
                ["Kullanıcı", totals.totalUsers],
                ["Toplam Görev", totals.totalTasks],
                ["Onaylı Görev", totals.approvedTasks],
                ["Ortalama Puan", totals.avgScore],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ borderRadius: 20, border: "1px solid #e5e7eb", background: "#f9fafb", padding: 18 }}>
                  <div style={{ color: "#4b5563", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...cardStyle(), padding: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Kurallar</div>
            <div style={{ color: "#4b5563", marginTop: 6 }}>Daha okunur ve ikonlu görünüm</div>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {RULES.map((rule) => (
                <div key={rule.text} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 16, border: "1px solid #d1d5db", background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", fontWeight: 700 }}>
                  <span style={{ fontSize: 20 }}>{rule.icon}</span>
                  <span>{rule.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ ...cardStyle(), padding: 8, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 24 }}>
          {[
            ["dashboard", "Dashboard"],
            ["leaderboard", "Sıralama"],
            ["users", "Kullanıcılar"],
            ["daily", "Görevler"],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setTab(value)} style={{ padding: "12px 14px", borderRadius: 16, border: 0, background: tab === value ? "#111827" : "transparent", color: tab === value ? "#ffffff" : "#374151", cursor: "pointer", fontWeight: 700 }}>{label}</button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,0.8fr)" }}>
            <section style={{ ...cardStyle(), padding: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{isAdmin ? "Genel Liderlik Tablosu" : "Benim Lig Durumum"}</div>
              <div style={{ color: "#4b5563", marginTop: 6 }}>{isAdmin ? "Toplam puana göre canlı sıralama" : "Kendi puan, streak ve lig özetin"}</div>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {(isAdmin ? leaderboard : [currentUser]).filter(Boolean).map((user) => (
                  <div key={user!.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 16, alignItems: "center", borderRadius: 20, border: "1px solid #e5e7eb", background: "#f9fafb", padding: 16 }}>
                    <div style={{ fontSize: 28 }}>{medal(user!.generalRank)}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{user!.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 14 }}>{user!.id} • {user!.league}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 22 }}>{user!.totalPoints}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>haftalık {user!.weeklyPoints}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...cardStyle(), padding: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Aktif Profil</div>
              <div style={{ color: "#4b5563", marginTop: 6 }}>Oturum açan kullanıcı özeti</div>
              <div style={{ padding: 20, borderRadius: 24, border: "1px solid #bfdbfe", background: "#eff6ff", marginTop: 18 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{currentUser?.name}</div>
                <div style={{ color: "#4b5563" }}>{currentUser?.email}</div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
                  {[
                    ["Toplam Puan", currentUser?.totalPoints || 0],
                    ["Lig", currentUser?.league || "Demir"],
                    ["Haftalık", currentUser?.weeklyPoints || 0],
                    ["Rol", isAdmin ? "Admin" : "Kullanıcı"],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ borderRadius: 18, background: "#ffffff", padding: 16 }}>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{label}</div>
                      <div style={{ fontWeight: 800, fontSize: 24, marginTop: 6 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
            {[{ title: "Genel Sıralama", data: isAdmin ? leaderboard : [currentUser] }, { title: "Haftalık Sıralama", data: isAdmin ? weeklyBoard : [currentUser] }].map((block, idx) => (
              <section key={block.title} style={{ ...cardStyle(), padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{block.title}</div>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {block.data.filter(Boolean).map((user) => (
                    <div key={user!.id} style={{ display: "grid", gridTemplateColumns: idx === 0 ? "70px 1fr 120px 120px" : "70px 1fr 120px", gap: 12, alignItems: "center", borderRadius: 18, border: "1px solid #e5e7eb", background: "#f9fafb", padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700 }}>{medal(idx === 0 ? user!.generalRank : user!.weeklyRank)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{user!.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>{user!.id}</div>
                      </div>
                      {idx === 0 ? <span style={{ ...badgeStyle(user!.league), padding: "8px 12px", borderRadius: 999, fontWeight: 700, justifySelf: "start" }}>{user!.league}</span> : null}
                      <div style={{ textAlign: "right", fontWeight: 800, fontSize: 20 }}>{idx === 0 ? user!.totalPoints : user!.weeklyPoints}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === "users" && (
          <section style={{ ...cardStyle(), padding: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{isAdmin ? "Kullanıcı Yönetimi" : "Profilim"}</div>
            <div style={{ color: "#4b5563", marginTop: 6 }}>{isAdmin ? "Tüm kullanıcıları görüntüle ve düzenle" : "Kendi kullanıcı bilgilerini düzenle"}</div>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 18 }}>
              {visibleUsers.map((user) => (
                <div key={user.id} style={{ borderRadius: 20, border: "1px solid #e5e7eb", background: "#f9fafb", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ color: "#6b7280" }}>{user.id}</div>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: user.role === "admin" ? "#7c3aed" : "#059669", color: "#ffffff", fontWeight: 700 }}>{user.role}</span>
                  </div>
                  <input style={inputStyle()} value={user.name} onChange={(e) => updateUserName(user.id, e.target.value)} />
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#ffffff", color: "#4b5563" }}>{user.email}</div>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
                    <div style={{ borderRadius: 14, background: "#ffffff", padding: 12 }}><div style={{ color: "#6b7280", fontSize: 12 }}>Puan</div><div style={{ fontSize: 22, fontWeight: 800 }}>{user.totalPoints}</div></div>
                    <div style={{ borderRadius: 14, background: "#ffffff", padding: 12 }}><div style={{ color: "#6b7280", fontSize: 12 }}>Lig</div><div style={{ fontSize: 18, fontWeight: 800 }}>{user.league}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "daily" && (
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "320px minmax(0,1fr)" }}>
            <section style={{ ...cardStyle(), padding: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{isAdmin ? "Kullanıcı Seç" : "Benim Panelim"}</div>
              <div style={{ color: "#4b5563", marginTop: 6 }}>{isAdmin ? "Görev ve günlük detaylarını görüntüle" : "Kendi görev ve günlük detayların"}</div>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {(isAdmin ? stats : [currentUser]).filter(Boolean).map((u) => (
                  <button key={u!.id} onClick={() => setSelectedUser(u!.id)} style={{ borderRadius: 18, border: `1px solid ${effectiveSelectedUser === u!.id ? "#93c5fd" : "#e5e7eb"}`, background: effectiveSelectedUser === u!.id ? "#eff6ff" : "#f9fafb", padding: 14, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u!.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>{u!.id}</div>
                      </div>
                      <span style={{ ...badgeStyle(u!.league), padding: "6px 10px", borderRadius: 999, fontWeight: 700 }}>{u!.league}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section style={{ display: "grid", gap: 24 }}>
              <div style={{ ...cardStyle(), padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{activeUser?.name}</div>
                    <div style={{ color: "#4b5563", marginTop: 6 }}>Seçili kullanıcı özeti</div>
                  </div>
                  <span style={{ ...badgeStyle(activeUser?.league || "Demir"), padding: "8px 12px", borderRadius: 999, fontWeight: 700 }}>{activeUser?.league}</span>
                </div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginTop: 18 }}>
                  {[
                    ["Toplam", activeUser?.totalPoints || 0],
                    ["Streak", activeUser?.streak || 0],
                    ["Haftalık", activeUser?.weeklyPoints || 0],
                    ["Genel Sıra", `#${activeUser?.generalRank || 0}`],
                  ].map(([label, value]) => (
                    <div key={String(label)} style={{ borderRadius: 18, background: "#f9fafb", padding: 16 }}>
                      <div style={{ color: "#6b7280" }}>{label}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
                <section style={{ ...cardStyle(), padding: 24 }}>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>Görev Ekle</div>
                  <div style={{ color: "#4b5563", marginTop: 6 }}>{isAdmin ? "Admin isterse onay durumunu seçebilir." : "Kullanıcı eklediği görevi anında tamamlanmış olarak kaydeder."}</div>
                  <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Tarih</div>
                      <input type="date" style={inputStyle()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Puan</div>
                      <input type="number" style={inputStyle()} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder="0 - 100" />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Görev</div>
                      <input style={inputStyle()} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Görev adı" />
                    </div>
                    {isAdmin ? (
                      <div>
                        <div style={{ marginBottom: 8, fontWeight: 600 }}>Onay Durumu</div>
                        <select style={inputStyle()} value={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.value })}>
                          <option value="E">Onaylı</option>
                          <option value="H">Onaysız</option>
                        </select>
                      </div>
                    ) : null}
                    <button onClick={addTask} style={{ border: 0, borderRadius: 14, background: "#111827", color: "#ffffff", padding: "14px 18px", fontWeight: 700, cursor: "pointer" }}>Görevi Ekle</button>
                  </div>
                </section>

                <section style={{ ...cardStyle(), padding: 24 }}>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>Günlük Hesap Özeti</div>
                  <div style={{ color: "#4b5563", marginTop: 6 }}>Excel mantığına göre otomatik hesaplanır</div>
                  <div style={{ display: "grid", gap: 12, marginTop: 18, maxHeight: 360, overflow: "auto" }}>
                    {(activeUser?.summary || []).length === 0 ? <div style={{ padding: 20, borderRadius: 18, border: "1px dashed #d1d5db", textAlign: "center", color: "#6b7280" }}>Henüz günlük kayıt yok.</div> : null}
                    {(activeUser?.summary || []).map((day) => (
                      <div key={day.date} style={{ borderRadius: 18, border: "1px solid #e5e7eb", background: "#f9fafb", padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ fontWeight: 700 }}>{day.date}</div>
                          <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ffffff", fontWeight: 700 }}>{day.league}</span>
                        </div>
                        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", marginTop: 12 }}>
                          {[
                            ["Günlük Puan", day.dailyPoints],
                            ["Ceza", `-${day.penalty}`],
                            ["Bonus", `+${day.bonus}`],
                            ["Streak", day.streak],
                            ["Toplam", day.totalPoints],
                          ].map(([label, value]) => (
                            <div key={String(label)}>
                              <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
                              <div style={{ fontWeight: 800, fontSize: 20, marginTop: 4 }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section style={{ ...cardStyle(), padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>Görev Listesi</div>
                <div style={{ color: "#4b5563", marginTop: 6 }}>{isAdmin ? "İstersen onay durumunu yönetebilirsin" : "Görevlerin tamamlanmış olarak kaydedilir"}</div>
                <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                  {activeRawTasks.length === 0 ? <div style={{ padding: 20, borderRadius: 18, border: "1px dashed #d1d5db", textAlign: "center", color: "#6b7280" }}>Görev bulunamadı.</div> : null}
                  {activeRawTasks.map((task) => (
                    <div key={task.id} style={{ borderRadius: 18, border: "1px solid #e5e7eb", background: "#f9fafb", padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{task.task}</div>
                          <div style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>{task.date} • {clampTaskPoints(task.points)} puan • Ekleyen: {task.createdBy || "-"}</div>
                        </div>
                        <span style={{ padding: "8px 12px", borderRadius: 999, background: task.approved ? "#059669" : "#e11d48", color: "#ffffff", fontWeight: 700 }}>{task.approved ? "Onaylı" : "Onaysız"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </div>
        )}

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1.1fr) minmax(280px,0.9fr)", marginTop: 24 }}>
          <section style={{ ...cardStyle(), padding: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Eklenen Sistemler</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginTop: 18 }}>
              {[
                "E-posta ve şifre ile giriş ekranı eklendi.",
                "Yeni kullanıcı kayıt akışı eklendi.",
                "Kullanıcı, görev ve oturum verileri kalıcı hale getirildi.",
                "Admin ve kullanıcı rol bazlı görünüm ayrıldı.",
                "Kullanıcı kendi görevini doğrudan tamamlanmış olarak kaydedebilir.",
                "Panel öncesi modern giriş ekranı tasarlandı.",
              ].map((item) => (
                <div key={item} style={{ borderRadius: 18, background: "#f9fafb", padding: 16, color: "#374151" }}>{item}</div>
              ))}
            </div>
          </section>
          <section style={{ ...cardStyle(), padding: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Not</div>
            <div style={{ color: "#4b5563", lineHeight: 1.7, marginTop: 12 }}>
              Bu sürüm deploy edilebilir bir Next.js proje yapısına dönüştürüldü. Bir sonraki aşamada Supabase veya Firebase ile gerçek veritabanı ve canlı auth akışı eklenebilir.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
