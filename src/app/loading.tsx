export default function Loading() {
  return (
    <div className="discovery-main" aria-busy="true" aria-label="Loading">
      <div className="stack" style={{ paddingBlock: "24px" }}>
        <div className="skeleton" style={{ height: "36px", width: "42%" }} />
        <div className="skeleton" style={{ height: "18px", width: "64%" }} />
        <div className="panel stack" style={{ marginTop: "12px" }}>
          <div className="skeleton" style={{ height: "24px", width: "30%" }} />
          <div className="skeleton" style={{ height: "120px", width: "100%" }} />
          <div className="skeleton" style={{ height: "44px", width: "180px" }} />
        </div>
      </div>
    </div>
  );
}
