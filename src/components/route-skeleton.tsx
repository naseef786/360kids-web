export function RouteSkeleton({
  variant = "dashboard",
}: {
  variant?: "explore" | "detail" | "dashboard" | "list" | "profile";
}) {
  return (
    <div className="discovery-main route-skeleton" aria-busy="true" aria-label="Loading">
      <div className="stack" style={{ paddingBlock: "20px" }}>
        <div className="skeleton" style={{ height: "14px", width: "120px" }} />
        <div className="skeleton" style={{ height: "34px", width: "56%" }} />
        <div className="skeleton" style={{ height: "16px", width: "74%" }} />
        {variant === "explore" && (
          <>
            <div className="panel skeleton" style={{ height: "72px", width: "100%" }} />
            <div className="activity-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="activity-card">
                  <div className="skeleton" style={{ height: "176px", width: "100%" }} />
                  <div className="activity-body stack">
                    <div className="skeleton" style={{ height: "20px", width: "80px" }} />
                    <div className="skeleton" style={{ height: "22px", width: "80%" }} />
                    <div className="skeleton" style={{ height: "16px", width: "60%" }} />
                    <div className="skeleton" style={{ height: "44px", width: "100%" }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {variant === "detail" && (
          <div className="detail-grid">
            <div className="stack">
              <div className="skeleton" style={{ height: "280px", borderRadius: "20px" }} />
              <div className="panel skeleton" style={{ height: "180px" }} />
            </div>
            <div className="panel skeleton" style={{ height: "360px" }} />
          </div>
        )}
        {(variant === "dashboard" || variant === "list" || variant === "profile") && (
          <div className="stack">
            <div className="metric-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="panel skeleton" style={{ height: "92px" }} />
              ))}
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="panel skeleton" style={{ height: "128px" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
