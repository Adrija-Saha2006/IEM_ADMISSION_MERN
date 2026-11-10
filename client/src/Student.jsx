import React, { useEffect, useState } from "react";
import { api, FEE, COURSES, courseName, fmt, fmtd } from "./api";
import { Ico, StatusChip, CoverDecor, Modal, useModal, toast } from "./ui";

const appComplete = (a) => a && a.personal && a.personal.dob && a.academic && a.academic.percentage && a.course;
const docsOk = (a) => { const t = (a?.documents || []).map((d) => d.type); return ["Marksheet", "ID Proof", "Photo"].every((x) => t.includes(x)); };
const paidOk = (a) => a && a.payment && a.payment.status === "Paid";

export default function Student({ user, view, setView }) {
  const [app, setApp] = useState(null);
  const [merit, setMerit] = useState(null);
  const [loading, setLoading] = useState(true);
  const modal = useModal();

  async function reload() {
    try { const { application } = await api.myApp(); setApp(application); } catch (e) { toast(e.message, "bad"); }
  }
  useEffect(() => {
    (async () => { setLoading(true); await reload(); try { const { merit } = await api.merit(); setMerit(merit); } catch {} setLoading(false); })();
  }, [view]);

  if (loading) return <div className="card pad">Loading…</div>;

  if (view === "apply") return <Apply app={app} reload={reload} setView={setView} />;
  if (view === "docs") return <Documents app={app} reload={reload} setView={setView} />;
  if (view === "pay") return <Payment app={app} reload={reload} setView={setView} modal={modal} />;
  if (view === "track") return <Track app={app} merit={merit} setView={setView} />;
  if (view === "merit") return <MeritView app={app} merit={merit} setView={setView} />;
  return <Dashboard user={user} app={app} merit={merit} setView={setView} />;
}

function Empty({ title, desc, go, btn, setView }) {
  return (
    <div className="card pad" style={{ textAlign: "center", padding: "44px 20px" }}>
      <h2 className="display" style={{ fontSize: 24 }}>{title}</h2>
      <p className="muted" style={{ margin: "10px auto 18px", maxWidth: 400 }}>{desc}</p>
      <button className="btn primary" onClick={() => setView(go)}>{btn}</button>
    </div>
  );
}

function Dashboard({ user, app, merit, setView }) {
  const a = app;
  const steps = [["Account", true], ["Application", !!appComplete(a)], ["Documents", !!docsOk(a)], ["Payment", !!paidOk(a)], ["Submitted", a && a.status !== "Draft"]];
  const doneN = steps.filter((s) => s[1]).length;
  let curIx = steps.findIndex((s) => !s[1]); if (curIx < 0) curIx = steps.length - 1;
  const st = a ? a.status : "Draft";
  const off = (339.29 * (1 - doneN / steps.length)).toFixed(1);
  const Q = ({ v, ic, title, desc, primary }) => (
    <div className={"card " + (primary ? "primary" : "")} onClick={() => setView(v)}>
      <div className="mi"><Ico name={ic} /></div><h4>{title}</h4><div className="muted k">{desc}</div>
    </div>
  );
  const nextCard = !appComplete(a) ? <Q v="apply" ic="form" title="Fill application" desc="Personal, academic & course details" primary />
    : !docsOk(a) ? <Q v="docs" ic="doc" title="Upload documents" desc="Marksheet, ID proof & photo" primary />
    : !paidOk(a) ? <Q v="pay" ic="pay" title={"Pay application fee"} desc={"₹" + FEE + " to submit"} primary />
    : a.status === "Draft" ? <Q v="apply" ic="form" title="Review & submit" desc="Submit your completed application" primary />
    : <Q v="track" ic="track" title="Track status" desc="See where your application stands" primary />;
  return (
    <>
      <div className="cover"><CoverDecor /><div className="in">
        <div>
          <span className="eyebrow">Applicant workspace</span>
          <h1>Welcome, {user.name.split(" ")[0]}</h1>
          <div className="cvsub">{
            a && a.status === "Selected" ? "Congratulations — you’ve been selected. See your result below."
              : a && a.status === "Rejected" ? "Your result is available under Status."
              : a && a.status !== "Draft" ? "Your application is " + st.toLowerCase() + ". Track it anytime."
              : "Let’s complete your admission application, step by step."}</div>
          <div style={{ marginTop: 14 }}><StatusChip s={st} /></div>
        </div>
        <div className="ring">
          <svg viewBox="0 0 120 120" width="138" height="138">
            <circle className="rb" cx="60" cy="60" r="54" /><circle className="rf" cx="60" cy="60" r="54" style={{ strokeDashoffset: off }} />
          </svg>
          <div className="rc"><b>{doneN}/{steps.length}</b><span>steps done</span></div>
        </div>
      </div></div>

      <div className="card pad" style={{ marginBottom: 18 }}><div className="stepper">
        {steps.map((s, i) => (
          <div className={"step " + (s[1] ? "done" : i === curIx ? "cur" : "")} key={i}>
            <span className="bub">{s[1] ? "✓" : i + 1}</span><small>{s[0]}</small>
          </div>
        ))}
      </div></div>

      <div className="qa">
        {nextCard}
        <Q v="apply" ic="form" title="My Application" desc={appComplete(a) ? "Completed — view or edit" : "Not started"} />
        <Q v="docs" ic="doc" title="Documents" desc={(a?.documents?.length || 0) + " uploaded"} />
        <Q v="pay" ic="pay" title="Payment" desc={paidOk(a) ? "Paid ₹" + FEE : "Pending"} />
        <Q v="merit" ic="merit" title="Merit List" desc={merit && merit.published ? "Published — view" : "Not published yet"} />
      </div>
    </>
  );
}

function Apply({ app, reload, setView }) {
  const a = app || { personal: {}, academic: {}, course: "" };
  const locked = a.status && a.status !== "Draft";
  const [p, setP] = useState(a.personal || {});
  const [ac, setAc] = useState(a.academic || {});
  const [course, setCourse] = useState(a.course || "");
  const [busy, setBusy] = useState(false);

  async function save(next) {
    setBusy(true);
    try {
      await api.saveApp({ personal: p, academic: { ...ac, percentage: parseFloat(ac.percentage) || "" }, course });
      toast("Application saved", "ok");
      await reload();
      if (next) setView("docs"); else setView("apply");
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  const inp = (obj, setObj, key) => ({ value: obj[key] ?? "", onChange: (e) => setObj({ ...obj, [key]: e.target.value }), disabled: locked, className: "input" });
  return (
    <>
      <div className="page-h"><div><h1>My Application</h1><div className="sub">All fields marked * are required.</div></div>{locked && <StatusChip s={a.status} />}</div>
      {locked && <div className="banner"><Ico name="check" /><div>Your application is {a.status.toLowerCase()} and can no longer be edited.</div></div>}
      <div className="card pad">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Personal details</h3>
        <div className="grid2">
          <div className="field"><label className="f">Date of birth *</label><input type="date" {...inp(p, setP, "dob")} /></div>
          <div className="field"><label className="f">Gender</label><select {...inp(p, setP, "gender")}>{["—", "Female", "Male", "Other"].map((g) => <option key={g}>{g}</option>)}</select></div>
        </div>
        <div className="grid2">
          <div className="field"><label className="f">Category</label><select {...inp(p, setP, "category")}>{["General", "OBC", "SC", "ST", "EWS"].map((g) => <option key={g}>{g}</option>)}</select></div>
          <div className="field"><label className="f">Address</label><input {...inp(p, setP, "address")} placeholder="City, State" /></div>
        </div>
        <div className="hr" />
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Academic details</h3>
        <div className="grid2">
          <div className="field"><label className="f">Board</label><select {...inp(ac, setAc, "board")}>{["CBSE", "ICSE", "State Board", "Other"].map((g) => <option key={g}>{g}</option>)}</select></div>
          <div className="field"><label className="f">Passing year</label><input {...inp(ac, setAc, "year")} placeholder="2024" /></div>
        </div>
        <div className="grid2">
          <div className="field"><label className="f">Aggregate (%) *</label><input type="number" min="0" max="100" {...inp(ac, setAc, "percentage")} placeholder="e.g. 88" /></div>
          <div className="field"><label className="f">Course preference *</label>
            <select className="input" value={course} disabled={locked} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Select a course…</option>
              {COURSES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name} (cutoff {c.cutoff}%)</option>)}
            </select></div>
        </div>
        {!locked && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <button className="btn primary" disabled={busy} onClick={() => save(false)}>Save application</button>
            <button className="btn amber" disabled={busy} onClick={() => save(true)}>Save &amp; upload documents →</button>
          </div>
        )}
      </div>
    </>
  );
}

function Documents({ app, reload, setView }) {
  const a = app;
  const [type, setType] = useState("Marksheet");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!a) return <Empty title="Start your application first" desc="Fill in your details before uploading documents." go="apply" btn="Go to application" setView={setView} />;
  const locked = a.status && a.status !== "Draft";
  const req = ["Marksheet", "ID Proof", "Photo"];
  const have = (a.documents || []).map((d) => d.type);
  const missing = req.filter((t) => !have.includes(t));
  async function upload() {
    if (!file) return toast("Choose a file first", "bad");
    if (file.size > 5 * 1024 * 1024) return toast("File exceeds the 5 MB limit", "bad");
    const fd = new FormData(); fd.append("file", file); fd.append("type", type);
    setBusy(true);
    try { await api.uploadDoc(fd); toast(type + " uploaded", "ok"); setFile(null); await reload(); }
    catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  async function remove(id) { try { await api.deleteDoc(id); await reload(); } catch (e) { toast(e.message, "bad"); } }
  return (
    <>
      <div className="page-h"><div><h1>Documents</h1><div className="sub">Required: Marksheet, ID Proof, Photo · max 5 MB each.</div></div>{docsOk(a) && <span className="chip c-sel">Complete</span>}</div>
      <div className="card pad">
        {(a.documents || []).length ? (a.documents.map((d) => (
          <div className="docitem" key={d._id}><Ico name="doc" />
            <div className="grow"><div style={{ fontWeight: 700 }}>{d.originalName}</div>
              <div className="muted" style={{ fontSize: 13 }}>{d.type} · {Math.round(d.size / 1024)} KB {d.verified && <span style={{ color: "var(--ok)", fontWeight: 700 }}>· verified</span>}</div></div>
            {!locked && <button className="btn sm bad" onClick={() => remove(d._id)}>Remove</button>}
          </div>
        ))) : <div className="muted" style={{ marginBottom: 12 }}>No documents uploaded yet.</div>}
        {!locked && (
          <>
            <div className="hr" />
            <div className="grid2">
              <div className="field"><label className="f">Document type</label><select className="input" value={type} onChange={(e) => setType(e.target.value)}>{req.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="field"><label className="f">Choose file</label><input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} /></div>
            </div>
            <button className="btn primary" disabled={busy} onClick={upload}>Upload document</button>
            {missing.length > 0 && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Still needed: {missing.join(", ")}</div>}
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 16 }}>
        {!docsOk(a) && <span className="muted" style={{ fontSize: 13 }}>Upload all three documents to continue.</span>}
        <button className="btn primary" disabled={!docsOk(a)} onClick={() => setView("pay")}>Next: Payment →</button>
      </div>
    </>
  );
}

function Payment({ app, reload, setView, modal }) {
  const a = app;
  if (!a) return <Empty title="Nothing to pay for yet" desc="Complete your application first." go="apply" btn="Go to application" setView={setView} />;
  async function submitNow() {
    try { await api.submit(); await reload(); setView("track"); toast("Application submitted", "ok"); }
    catch (e) { toast(e.message, "bad"); }
  }
  function openGateway() {
    let method = "UPI", fail = false;
    modal.open(
      <Modal title="Payment Gateway" onClose={modal.close}
        footer={<>
          <button className="btn" onClick={modal.close}>Cancel</button>
          <button className="btn primary" onClick={async () => {
            if (fail) { modal.close(); return toast("Payment failed — please try again", "bad"); }
            try { await api.pay({ method }); modal.close(); toast("Payment successful", "ok"); await reload(); }
            catch (e) { toast(e.message, "bad"); }
          }}>Pay ₹{FEE}</button>
        </>}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Secure checkout · demo gateway</div>
        <div className="field"><label className="f">Method</label>
          <select className="input" defaultValue="UPI" onChange={(e) => (method = e.target.value)}>{["UPI", "Card", "Net Banking"].map((m) => <option key={m}>{m}</option>)}</select></div>
        <div className="field"><label className="f">Pay to</label><input className="input" value={"IEM Admissions — ₹" + FEE} disabled /></div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" onChange={(e) => (fail = e.target.checked)} /> Simulate a failed payment</label>
      </Modal>
    );
  }
  if (paidOk(a)) return (
    <>
      <div className="page-h"><div><h1>Payment</h1><div className="sub">Application fee</div></div><span className="chip c-paid">Paid</span></div>
      <div className="card pad">
        <div className="row"><div className="grow"><div className="t">Application fee</div><div className="s">Transaction {a.payment.txnId} · {a.payment.method}</div></div><div className="rankcol">₹{a.payment.amount}</div></div>
        <div className="banner" style={{ marginTop: 14 }}><Ico name="check" /><div>Payment received. You can now submit your application.</div></div>
        {a.status === "Draft" && <button className="btn primary" onClick={submitNow}>Review &amp; submit application →</button>}
      </div>
    </>
  );
  return (
    <>
      <div className="page-h"><div><h1>Payment</h1><div className="sub">A one-time application fee is required to submit.</div></div><span className="chip c-unpaid">Pending</span></div>
      <div className="card pad">
        <div className="row"><div className="grow"><div className="t">IEM Admission application fee</div><div className="s">Non-refundable · processed via payment gateway</div></div><div className="rankcol">₹{FEE}</div></div>
        <button className="btn primary" style={{ marginTop: 14 }} disabled={!appComplete(a)} onClick={openGateway}>Pay ₹{FEE} →</button>
        {!appComplete(a) && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Complete your application details first.</div>}
      </div>
    </>
  );
}

function Track({ app, merit, setView }) {
  const a = app;
  if (!a || a.status === "Draft") return <Empty title="No submission yet" desc="Submit your application to start tracking it." go="apply" btn="Go to application" setView={setView} />;
  const hist = a.history || [];
  const isRej = a.status === "Rejected";
  const steps = [{ s: "Submitted" }, { s: "Under Review" }, { s: isRej ? "Rejected" : "Selected" }];
  const rank = merit && merit.published ? (merit.entries.find((e) => String(e.application) === String(a._id))?.rank) : null;
  return (
    <>
      <div className="page-h"><div><h1>Application status</h1><div className="sub">ID {a._id} · {courseName(a.course)}</div></div><StatusChip s={a.status} /></div>
      <div className="card pad">
        {steps.map((step, i) => {
          const h = hist.find((x) => x.s === step.s);
          const cls = h ? (step.s === "Rejected" ? "c-rej" : step.s === "Selected" ? "c-sel" : "c-sub") : "c-draft";
          return <div className="row" key={i}>
            <span className={"chip " + cls} style={{ minWidth: 122, justifyContent: "center" }}>{step.s}</span>
            <div className="grow"><div className="s">{h ? fmt(h.t) : "Pending"}{h && step.s === "Rejected" && a.reason ? " · Reason: " + a.reason : ""}</div></div>
          </div>;
        })}
      </div>
      {a.status === "Selected" && <div style={{ marginTop: 16 }}><Offer a={a} rank={rank} /></div>}
      {a.status === "Rejected" && <div className="banner" style={{ marginTop: 16 }}><Ico name="bell" /><div>We’re sorry — your application was not selected in this round.{a.reason ? " Reason: " + a.reason : ""}</div></div>}
    </>
  );
}

function Offer({ a, rank }) {
  const text = `IEM — Provisional Offer of Admission\n\nDear ${a.name},\n\nCongratulations! You have been selected for admission to the ${courseName(a.course)} programme at the Institute of Engineering & Management${rank ? " with merit rank #" + rank : ""}.\n\nPlease complete the admission formalities as advised by the admission office.\n\nAdmission Office, IEM`;
  return (
    <div className="offer"><div className="seal">IEM</div>
      <h2>Provisional Offer of Admission</h2>
      <p style={{ margin: "12px 0" }}>Dear <b>{a.name}</b>,</p>
      <p style={{ margin: "12px 0" }}>Congratulations! Based on your merit, you have been <b>selected</b> for admission to the <b>{courseName(a.course)}</b> programme at the Institute of Engineering &amp; Management{rank ? <> with merit rank <b>#{rank}</b></> : null}.</p>
      <p style={{ margin: "12px 0" }}>Please complete the admission formalities as advised by the admission office. This provisional offer is subject to verification of original documents.</p>
      <p style={{ margin: "16px 0 0" }}><b>Admission Office, IEM</b></p>
      <div style={{ marginTop: 16, display: "flex", gap: 10, position: "relative" }}>
        <button className="btn amber" onClick={() => { navigator.clipboard?.writeText(text).then(() => toast("Copied to clipboard", "ok"), () => toast("Copy not available", "bad")); }}>Copy letter text</button>
      </div>
    </div>
  );
}

function MeritView({ app, merit, setView }) {
  if (!merit || !merit.published) return <Empty title="Merit list not published yet" desc="The admission office hasn’t published the merit list. You’ll be notified when it’s out." go="track" btn="Back to status" setView={setView} />;
  const a = app;
  return (
    <>
      <div className="page-h"><div><h1>Merit List</h1><div className="sub">Published {fmtd(merit.publishDate)} · {merit.entries.length} selected candidates</div></div><span className="chip c-sel">Published</span></div>
      {a && a.status === "Selected" && <div className="banner"><Ico name="check" /><div>You are on the merit list. See your offer letter under <b>&nbsp;Status</b>.</div></div>}
      <div className="tablewrap"><table className="tbl"><thead><tr><th>Rank</th><th>Candidate</th><th>Course</th><th>Score</th></tr></thead>
        <tbody>{merit.entries.map((e) => {
          const mine = a && String(e.application) === String(a._id);
          return <tr key={e.rank} style={mine ? { background: "var(--info-bg)" } : null}>
            <td className="rankcol">#{e.rank}</td><td style={{ fontWeight: 700 }}>{e.name}{mine && <span className="chip c-sub" style={{ marginLeft: 6 }}>You</span>}</td><td>{e.course}</td><td className="tnum">{e.score}%</td></tr>;
        })}</tbody></table></div>
    </>
  );
}
