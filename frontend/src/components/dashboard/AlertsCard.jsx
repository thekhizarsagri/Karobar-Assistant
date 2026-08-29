import { useCallback, useEffect, useState } from "react";
import { clearAlerts, getAlerts } from "./api";
import ModalPortal from "./ModalPortal";

const POLL_INTERVAL_MS = 15000;
const MAX_VISIBLE = 3;

function AlertIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === "stock" ? (
        <>
          <path d="M6 7h12l-8 5v6l-2-1.5v-4.5l-4-3V9l2 .5" />
          <path d="M14 15l4 4" />
        </>
      ) : type === "profit" ? (
        <>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </>
      ) : (
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      )}
    </svg>
  );
}

function AlertsCard() {
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await getAlerts();
      setItems(result || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    const handleEvent = () => refresh();
    window.addEventListener("alerts:updated", handleEvent);
    window.addEventListener("notifications:updated", handleEvent);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("alerts:updated", handleEvent);
      window.removeEventListener("notifications:updated", handleEvent);
    };
  }, [refresh]);

  const handleClearAll = async () => {
    try {
      await clearAlerts();
      setItems([]);
      setShowAll(false);
      window.dispatchEvent(new CustomEvent("alerts:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const renderList = (list) => (
    <ul className="alerts-list">
      {list.map((item, index) => (
        <li key={`${item.type}-${item.title}-${index}`} className={`alert-item alert-item--${item.type || "info"}`}>
          <span className="alert-item-icon">
            <AlertIcon type={item.type} />
          </span>
          <div className="alert-item-body">
            <span className="alert-item-title">{item.title}</span>
            <p className="alert-item-message">{item.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  const visibleItems = items.slice(0, MAX_VISIBLE);
  const hasMore = items.length > MAX_VISIBLE;

  return (
    <>
      <div className="alerts-card">
        <div className="alerts-card-header">
          <h3>Alerts</h3>
          {items.length > 0 && (
            <button type="button" className="alerts-clear" onClick={handleClearAll}>
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="alerts-empty">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p>No alerts right now</p>
          </div>
        ) : (
          <>
            {renderList(visibleItems)}
            {hasMore && (
              <button type="button" className="alerts-show-more" onClick={() => setShowAll(true)}>
                Show more ({items.length - MAX_VISIBLE} more)
              </button>
            )}
          </>
        )}
      </div>

      {showAll && (
        <ModalPortal>
          <div className="stock-modal-backdrop" onClick={() => setShowAll(false)}>
            <div
              className="alerts-modal"
              role="dialog"
              aria-modal="true"
              aria-label="All alerts"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="alerts-modal-header">
                <span>All Alerts</span>
                <div className="alerts-modal-actions">
                  {items.length > 0 && (
                    <button type="button" className="alerts-clear" onClick={handleClearAll}>
                      Clear all
                    </button>
                  )}
                  <button type="button" className="alerts-modal-close" onClick={() => setShowAll(false)}>×</button>
                </div>
              </div>
              {items.length === 0 ? (
                <div className="alerts-empty">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  <p>No alerts right now</p>
                </div>
              ) : (
                <div className="alerts-modal-list">{renderList(items)}</div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

export default AlertsCard;