import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/* ---------- icons ---------- */
const PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  form: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
  doc: '<path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 2v6h6"/>',
  pay: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  track: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  merit: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
};
export function Ico({ name }) {
  return <svg className="mi" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: PATHS[name] || "" }} />;
}

/* ---------- status chip ---------- */
const CHIP = {
  Draft: ["c-draft", "Draft"], Submitted: ["c-sub", "Submitted"], "Under Review": ["c-rev", "Under Review"],
  Selected: ["c-sel", "Selected"], Rejected: ["c-rej", "Rejected"],
};
export function StatusChip({ s }) {
  const v = CHIP[s] || CHIP.Draft;
  return <span className={"chip " + v[0]}>{v[1]}</span>;
}

/* ---------- toast (plain DOM, outside React tree) ---------- */
export function toast(msg, kind) {
  const host = document.getElementById("toast");
  if (!host) return;
  const t = document.createElement("div");
  t.className = "toast " + (kind || "");
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => {
    t.style.transition = ".3s"; t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

/* ---------- modal (context + portal) ---------- */
const ModalCtx = createContext(null);
export function useModal() { return useContext(ModalCtx); }

export function ModalProvider({ children }) {
  const [node, setNode] = useState(null);
  const close = useCallback(() => setNode(null), []);
  const open = useCallback((content) => setNode(content), []);
  return (
    <ModalCtx.Provider value={{ open, close }}>
      {children}
      {node &&
        createPortal(
          <div className="scrim" onMouseDown={(e) => { if (e.target.classList.contains("scrim")) close(); }}>
            {node}
          </div>,
          document.getElementById("modal-root")
        )}
    </ModalCtx.Provider>
  );
}

/* ---------- small building blocks ---------- */
export function Modal({ title, children, footer, onClose }) {
  return (
    <div className="modal">
      <div className="mh">
        <h3>{title}</h3>
        <button className="iconbtn" onClick={onClose}><Ico name="x" /></button>
      </div>
      <div className="mb">{children}</div>
      {footer && <div className="mf">{footer}</div>}
    </div>
  );
}

export function CoverDecor() {
  return (
    <>
      <div className="cg" />
      <svg className="cv" preserveAspectRatio="none" viewBox="0 0 800 220">
        <path d="M-20 150 C 160 60, 320 220, 520 110 S 820 60, 860 150" />
      </svg>
      <div className="scrap" style={{ width: 46, height: 14, top: 20, right: 46, "--rot": "-18deg", "--dur": "6s" }} />
      <div className="scrap a" style={{ width: 14, height: 14, borderRadius: "50%", bottom: 22, right: 90, "--dur": "5s" }} />
      <div className="scrap p" style={{ width: 30, height: 9, bottom: 30, left: "40%", "--rot": "12deg", "--dur": "7s" }} />
    </>
  );
}
