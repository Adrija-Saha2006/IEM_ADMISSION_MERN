import React, { useEffect, useState } from "react";
import { api, courseName, fmtd } from "./api";
import { Ico, StatusChip, CoverDecor, Modal, useModal, toast } from "./ui";

export default function Admin({ view, setView }) {
  if (view === "apps") return <Applications />;
  if (view === "merit") return <AdminMerit />;
  if (view === "reports") return <Reports />;
  return <Dashboard setView={setView} />;
}

function Dashboard({ setView }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.adminStats().then((s) => setStats(s)).catch((e) => toast(e.message, "bad")); }, []);
  if (!stats) return <div className="card pad">Loading…</div>;
  const tiles = [
    ["Total applicants", stats.total, "var(--indigo)"], ["Submitted", stats.submitted, "var(--info)"],
    ["Under Review", stats.underReview, "var(--amber-2)"], ["Selected", stats.selected, "var(--ok)"], ["Rejected", stats.rejected, "var(--bad)"],
  ];
  const maxc = Math.max(1, stats.total);
  const maxb = Math.max(1, ...stats.byCourse.map((x) => x.n));
  return (
    <>
      <div className="cover"><CoverDecor /><div className="in">
        <div><span className="eyebrow">Control panel</span><h1>Admission Dashboard</h1>
          <div className="cvsub">Review applications, approve candidates and publish the merit list.</div></div>
        <button className="btn light" onClick={() => setView("apps")}>Review applications →</button>
      </div></div>
      <div className="tiles">
        {tiles.map((t) => (
          <div className="card tile" key={t[0]}>
            <div className="n" style={{ color: t[2] }}>{t[1]}</div><div className="l">{t[0]}</div>
            <div className="bar"><i style={{ width: Math.round((t[1] / maxc) * 100) + "%", background: t[2] }} /></div>
          </div>
        ))}
      </div>
      <div className="card pad" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Applicants by course</h3>
        {stats.byCourse.map((x) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }} key={x.course}>
            <div style={{ width: 52, fontWeight: 800 }}>{x.course}</div>
            <div className="bar" style={{ flex: 1, height: 12, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
              <i style={{ display: "block", height: "100%", width: Math.round((x.n / maxb) * 100) + "%", background: "var(--indigo)" }} /></div>
            <div className="tnum muted" style={{ width: 28, textAlign: "right", fontWeight: 700 }}>{x.n}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Applications() {
  const [apps, setApps] = useState(null);
  const modal = useModal();
  async function load() { try { const { applications } = await api.adminApps(); setApps(applications); } catch (e) { toast(e.message, "bad"); } }
  useEffect(() => { load(); }, []);
  if (!apps) return <div className="card pad">Loading…</div>;

  function openReview(a) {
    const allVer = (a.documents || []).every((d) => d.verified);
    async function verify(docId) { try { const { application } = await api.verifyDoc(a._id, docId); openReview(application); load(); } catch (e) { toast(e.message, "bad"); } }
    async function move(status, reason) {
      try { await api.setStatus(a._id, { status, reason }); modal.close(); toast(a.name + " → " + status, "ok"); load(); }
      catch (e) { toast(e.message, "bad"); }
    }
    function reject() {
      let reason = "";
      modal.open(<Modal title="Reject application" onClose={modal.close}
        footer={<><button className="btn" onClick={modal.close}>Cancel</button><button className="btn bad" onClick={() => move("Rejected", reason || "Not selected in this round")}>Reject application</button></>}>
        <div className="field"><label className="f">Reason (shown to applicant)</label>
          <textarea className="input" rows={3} onChange={(e) => (reason = e.target.value)} placeholder="e.g. Did not meet the cut-off for the chosen course" /></div>
      </Modal>);
    }
    let actions = null;
    if (a.status === "Submitted") actions = <button className="btn primary" onClick={() => move("Under Review")}>Move to Under Review</button>;
    else if (a.status === "Under Review") actions = <><button className="btn ok" disabled={!allVer} onClick={() => move("Selected")}>Approve (Select)</button><button className="btn bad" onClick={reject}>Reject</button></>;
    else actions = <span className="muted" style={{ alignSelf: "center", fontWeight: 600 }}>This application is {a.status.toLowerCase()}.</span>;

    modal.open(
      <Modal title={a.name + " · " + a._id} onClose={modal.close} footer={actions}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <StatusChip s={a.status} />
          {a.payment && a.payment.status === "Paid" ? <span className="chip c-paid">Fee paid</span> : <span className="chip c-unpaid">Unpaid</span>}
          <span className="chip c-draft">{courseName(a.course)}</span>
        </div>
        <div className="grid2">
          <div><div className="l" style={{ marginBottom: 6 }}>Academic</div>
            <div>Aggregate: <b>{a.academic?.percentage ?? "—"}%</b></div><div>Board: {a.academic?.board || "—"} ({a.academic?.year || "—"})</div></div>
          <div><div className="l" style={{ marginBottom: 6 }}>Personal</div>
            <div>DOB: {a.personal?.dob || "—"}</div><div>Category: {a.personal?.category || "—"}</div><div>{a.personal?.address || "—"}</div></div>
        </div>
        <div className="hr" /><div className="l" style={{ marginBottom: 8 }}>Documents</div>
        {(a.documents || []).map((d) => (
          <div className="docitem" key={d._id}><Ico name="doc" />
            <div className="grow"><div style={{ fontWeight: 700 }}>{d.type}</div><div className="muted" style={{ fontSize: 13 }}>{d.originalName} · {Math.round(d.size / 1024)} KB</div></div>
            {d.verified ? <span className="chip c-sel">Verified</span> : <button className="btn sm" onClick={() => verify(d._id)}>Mark verified</button>}
          </div>
        ))}
        {a.payment && a.payment.txnId && <><div className="hr" /><div className="muted" style={{ fontSize: 13 }}>Payment: ₹{a.payment.amount} · {a.payment.method} · {a.payment.txnId}</div></>}
      </Modal>
    );
  }

  return (
    <>
      <div className="page-h"><div><h1>Applications</h1><div className="sub">{apps.length} applications · click a row to review</div></div></div>
      <div className="tablewrap"><table className="tbl">
        <thead><tr><th>ID</th><th>Applicant</th><th>Course</th><th>Marks</th><th>Payment</th><th>Status</th></tr></thead>
        <tbody>{apps.length ? apps.map((a) => (
          <tr className="click" key={a._id} onClick={() => openReview(a)}>
            <td className="muted tnum">{a._id.slice(-6)}</td>
            <td style={{ fontWeight: 700 }}>{a.name}{a.demo && <span className="chip c-draft" style={{ marginLeft: 4 }}>demo</span>}</td>
            <td>{a.course}</td><td className="tnum">{a.academic?.percentage ?? "—"}%</td>
            <td>{a.payment?.status === "Paid" ? <span className="chip c-paid">Paid</span> : <span className="chip c-unpaid">Unpaid</span>}</td>
            <td><StatusChip s={a.status} /></td>
          </tr>
        )) : <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: 24 }}>No applications yet.</td></tr>}</tbody>
      </table></div>
    </>
  );
}

function AdminMerit() {
  const [merit, setMerit] = useState(null);
  const [selected, setSelected] = useState([]);
  async function load() {
    try {
      const { merit } = await api.merit(); setMerit(merit);
      const { applications } = await api.adminApps();
      setSelected(applications.filter((a) => a.status === "Selected").sort((x, y) => (y.academic?.percentage || 0) - (x.academic?.percentage || 0)));
    } catch (e) { toast(e.message, "bad"); }
  }
  useEffect(() => { load(); }, []);
  if (!merit) return <div className="card pad">Loading…</div>;
  async function gen() { try { await api.genMerit(); toast("Merit list published", "ok"); load(); } catch (e) { toast(e.message, "bad"); } }
  async function unpub() { try { await api.unpubMerit(); toast("Merit list unpublished"); load(); } catch (e) { toast(e.message, "bad"); } }
  return (
    <>
      <div className="page-h"><div><h1>Merit List</h1><div className="sub">Ranks selected candidates by aggregate score</div></div>{merit.published ? <span className="chip c-sel">Published</span> : <span className="chip c-draft">Draft</span>}</div>
      {merit.published && <div className="banner"><Ico name="check" /><div>Merit list published on {fmtd(merit.publishDate)}. Selected applicants can now see their rank and offer letter.</div></div>}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn primary" disabled={!selected.length} onClick={gen}>Generate &amp; publish merit list →</button>
          {merit.published && <button className="btn" onClick={unpub}>Unpublish</button>}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>{selected.length} candidate(s) currently selected.</div>
      </div>
      <div className="tablewrap"><table className="tbl"><thead><tr><th>Rank</th><th>Candidate</th><th>Course</th><th>Score</th></tr></thead>
        <tbody>{selected.length ? selected.map((a, i) => (
          <tr key={a._id}><td className="rankcol">#{i + 1}</td><td style={{ fontWeight: 700 }}>{a.name}</td><td>{a.course}</td><td className="tnum">{a.academic?.percentage || 0}%</td></tr>
        )) : <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 20 }}>No selected candidates yet. Approve applications under “Applications”.</td></tr>}</tbody>
      </table></div>
    </>
  );
}

function Reports() {
  const [stats, setStats] = useState(null);
  const [merit, setMerit] = useState(null);
  useEffect(() => { api.adminStats().then(setStats); api.merit().then((d) => setMerit(d.merit)).catch(() => {}); }, []);
  if (!stats) return <div className="card pad">Loading…</div>;
  const rows = [
    ["Total applications", stats.total], ["Fee paid", stats.paid], ["Submitted / awaiting review", stats.submitted],
    ["Under review", stats.underReview], ["Selected", stats.selected], ["Rejected", stats.rejected],
    ["Merit list", merit && merit.published ? "Published (" + merit.entries.length + ")" : "Not published"],
  ];
  return (
    <>
      <div className="page-h"><div><h1>Reports</h1><div className="sub">Summary of the current admission cycle</div></div></div>
      <div className="card pad">{rows.map((r) => (
        <div className="row" key={r[0]}><div className="grow"><div className="t">{r[0]}</div></div><div className="rankcol tnum">{r[1]}</div></div>
      ))}</div>
    </>
  );
}
