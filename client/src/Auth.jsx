import React, { useState } from "react";
import { api, setToken } from "./api";
import { toast } from "./ui";

const PHOTOS = [
  ["/campus1.jpg", "Classrooms"], ["/campus2.jpg", "Computer labs"], ["/campus3.jpg", "The campus"],
  ["/campus1.jpg", "Learn by doing"], ["/campus2.jpg", "Modern labs"], ["/campus3.jpg", "Green campus"],
];

export default function Auth({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("student");
  const [reg, setReg] = useState(null); // {stage:'otp', ...}
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ li_email: "", li_pass: "", rg_name: "", rg_email: "", rg_phone: "", rg_pass: "", rg_otp: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function doLogin() {
    setBusy(true);
    try {
      const { token, user } = await api.login({ email: f.li_email.trim(), password: f.li_pass, role });
      setToken(token);
      toast("Welcome back, " + user.name.split(" ")[0], "ok");
      onAuthed(user);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  function startRegister() {
    const name = f.rg_name.trim(), email = f.rg_email.trim(), pass = f.rg_pass;
    if (!name || !email || !pass) return toast("Please fill name, email and password", "bad");
    if (pass.length < 6) return toast("Password must be at least 6 characters", "bad");
    const otp = "" + Math.floor(100000 + Math.random() * 900000);
    setReg({ stage: "otp", name, email, phone: f.rg_phone.trim(), pass, otp });
  }
  async function verifyOtp() {
    if (f.rg_otp !== reg.otp) return toast("Incorrect OTP — check the demo code shown above", "bad");
    setBusy(true);
    try {
      const { token, user } = await api.register({ name: reg.name, email: reg.email, phone: reg.phone, password: reg.pass });
      setToken(token);
      toast("Account verified — welcome!", "ok");
      onAuthed(user);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }

  return (
    <div className="scene">
      <div className="scene-grid" />
      <svg className="scene-cv" preserveAspectRatio="none" viewBox="0 0 1000 800">
        <path className="d1" d="M-40 170 C 180 40, 360 260, 560 150 S 920 60, 1040 190" />
        <path className="d2" d="M-40 560 C 220 460, 360 660, 640 540 S 940 520, 1050 600" />
      </svg>
      <div className="scrap" style={{ width: 62, height: 18, top: "14%", left: "7%", "--rot": "-22deg", "--dur": "7s" }} />
      <div className="scrap a" style={{ width: 18, height: 18, borderRadius: "50%", top: "26%", right: "12%", "--dur": "5.5s" }} />
      <div className="scrap p" style={{ width: 44, height: 12, bottom: "16%", right: "8%", "--rot": "16deg", "--dur": "6.5s" }} />

      <div className="wrap hnav"><span className="wm">IEM</span><span className="bsub" style={{ opacity: 0.85 }}>Admission Portal</span></div>

      <div className="wrap hwrap"><div className="hgrid">
        <div className="hcopy">
          <span className="badge"><span className="pindot" /> Admissions 2025–26 · now open</span>
          <div className="stencil">
            <span className="line l1 t1"><span>ADMISSION</span></span>
            <span className="line l2 t2"><span>OPEN</span></span>
            <span className="line l3 t3"><span>2025 <em>—</em> 26</span></span>
          </div>
          <p className="hlead">Apply to the Institute of Engineering &amp; Management online. Upload documents, pay, and track your merit result — all in one place.</p>
          <div className="hpills"><span className="hpill"><b>1</b> Apply online</span><span className="hpill"><b>2</b> Upload &amp; pay</span><span className="hpill"><b>3</b> Get your merit rank</span></div>
        </div>

        <div className="authcard">
          <div className="tabs">
            <button className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setReg(null); }}>Log in</button>
            <button className={tab === "register" ? "active" : ""} onClick={() => { setTab("register"); setReg(null); }}>Register</button>
          </div>

          {tab === "login" ? (
            <>
              <div className="seg field">
                <label className={role === "student" ? "on" : ""} onClick={() => setRole("student")}>Applicant</label>
                <label className={role === "admin" ? "on" : ""} onClick={() => setRole("admin")}>Admission Officer</label>
              </div>
              <div className="field"><label className="f">Email</label>
                <input className="input" type="email" value={f.li_email} onChange={set("li_email")} placeholder={role === "admin" ? "admin@iem.edu" : "you@example.com"} /></div>
              <div className="field"><label className="f">Password</label>
                <input className="input" type="password" value={f.li_pass} onChange={set("li_pass")} placeholder="Your password" /></div>
              <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={doLogin}>Log in →</button>
            </>
          ) : reg && reg.stage === "otp" ? (
            <>
              <div className="banner">Code sent to <b>&nbsp;{reg.email}&nbsp;</b> (email / SMS). <b>&nbsp;Demo OTP: <kbd>{reg.otp}</kbd></b></div>
              <div className="field"><label className="f">Enter OTP</label>
                <input className="input" inputMode="numeric" maxLength={6} value={f.rg_otp} onChange={set("rg_otp")} placeholder="6-digit code" /></div>
              <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={verifyOtp}>Verify &amp; continue →</button>
              <button className="btn ghost" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => setReg(null)}>Back</button>
            </>
          ) : (
            <>
              <div className="field"><label className="f">Full name</label><input className="input" value={f.rg_name} onChange={set("rg_name")} placeholder="Your name" /></div>
              <div className="grid2">
                <div className="field"><label className="f">Email</label><input className="input" type="email" value={f.rg_email} onChange={set("rg_email")} placeholder="you@example.com" /></div>
                <div className="field"><label className="f">Phone</label><input className="input" value={f.rg_phone} onChange={set("rg_phone")} placeholder="Mobile" /></div>
              </div>
              <div className="field"><label className="f">Create password</label><input className="input" type="password" value={f.rg_pass} onChange={set("rg_pass")} placeholder="At least 6 characters" /></div>
              <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={startRegister}>Create account →</button>
            </>
          )}

          <div className="note" style={{ marginTop: 14 }}><b>Demo</b> — Officer: <kbd>admin@iem.edu</kbd> / <kbd>admin123</kbd>, or register as an applicant (a demo OTP is shown on screen).</div>
        </div>
      </div></div>

      <div className="strip"><div className="marquee"><div className="track">
        {[...PHOTOS, ...PHOTOS].map((p, i) => (
          <div className="photo" key={i}><img src={p[0]} alt={p[1]} loading="lazy" /><span>{p[1]}</span></div>
        ))}
      </div></div></div>

      <div className="wrap statrow">
        {[["4", "Programmes"], ["240", "Seats on offer"], ["3", "Steps to apply"], ["100%", "Online"]].map((s, i) => (
          <div className="stat" key={i}><div className="sn">{s[0]}</div><div className="sl">{s[1]}</div></div>
        ))}
      </div>

      <div className="hfoot"><div className="wrap">
        <span><span className="wm">IEM</span> · Institute of Engineering &amp; Management</span>
        <span>© 2026 IEM Admissions · MERN POC</span>
      </div></div>
    </div>
  );
}
