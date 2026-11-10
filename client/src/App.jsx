import React, { useState, useEffect } from "react";
import { api, setToken, getToken } from "./api";
import { Ico, ModalProvider, toast } from "./ui";
import Auth from "./Auth.jsx";
import Student from "./Student.jsx";
import Admin from "./Admin.jsx";

function Shell({ user, onLogout }) {
  const [view, setView] = useState("dash");
  const nav = user.role === "student"
    ? [["dash", "grid", "Dashboard"], ["apply", "form", "My Application"], ["docs", "doc", "Documents"], ["pay", "pay", "Payment"], ["track", "track", "Status"], ["merit", "merit", "Merit List"]]
    : [["dash", "grid", "Dashboard"], ["apps", "users", "Applications"], ["merit", "merit", "Merit List"], ["reports", "chart", "Reports"]];
  return (
    <>
      <header className="topbar"><div className="wrap">
        <div className="brand"><span className="wm">IEM</span><span className="bsub">Admission Portal</span></div>
        <div className="spacer" />
        <div className="whoami"><div className="nm">{user.name}</div><div className="rl">{user.role === "admin" ? "Admission Officer" : "Applicant"}</div></div>
        <button className="iconbtn" title="Log out" onClick={onLogout}><Ico name="logout" /></button>
      </div></header>
      <div className="wrap shell">
        <nav className="side">
          {nav.map((n) => (
            <a key={n[0]} className={"nav" + (view === n[0] ? " active" : "")} onClick={() => setView(n[0])}>
              <span className="mi"><Ico name={n[1]} /></span>{n[2]}
            </a>
          ))}
        </nav>
        <main>{user.role === "student" ? <Student user={user} view={view} setView={setView} /> : <Admin view={view} setView={setView} />}</main>
      </div>
      <div className="footer">IEM Admission System · MERN POC · built for the SWE Laboratory</div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { const { user } = await api.me(); setUser(user); } catch { setToken(""); }
      }
      setReady(true);
    })();
  }, []);
  function logout() { setToken(""); setUser(null); toast("Logged out"); }
  if (!ready) return null;
  return (
    <ModalProvider>
      {user ? <Shell user={user} onLogout={logout} /> : <Auth onAuthed={setUser} />}
    </ModalProvider>
  );
}
