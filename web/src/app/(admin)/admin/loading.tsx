// Shown instantly on navigation while the page's data loads, so clicking a rail
// item responds immediately instead of appearing to hang. The rail comes from
// the layout and stays put; only this body is replaced.
export default function AdminLoading() {
  return (
    <>
      <header className="admin-topbar">
        <div className="topbar-head">
          <div className="crumbs">
            <span className="sk sk-pill" />
          </div>
          <span className="sk sk-h1" />
          <span className="sk sk-sub" />
        </div>
      </header>
      <div className="admin-content">
        <div className="sk-stack">
          <span className="sk sk-panel" />
          <span className="sk sk-panel" />
          <span className="sk sk-panel" />
        </div>
      </div>
    </>
  )
}
