import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import ApplicationCard from "../components/ApplicationCard";
import ApplicationModal from "../components/ApplicationModal";
import { STAGES } from "../constants";

export default function Board() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [overStage, setOverStage] = useState(null);
  // modal is null (closed), { application: null, stage } (add) or { application } (edit)
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api
      .get("/applications/", { params: { page_size: 200 } })
      .then((res) => setApplications(res.data.results))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const moveCard = async (id, stage) => {
    const original = applications.find((a) => a.id === id);
    if (!original || original.stage === stage) return;

    // Optimistic update: move the card on screen immediately.
    setError("");
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, stage } : a)));

    try {
      const res = await api.patch(`/applications/${id}/`, { stage });
      setApplications((apps) => apps.map((a) => (a.id === id ? res.data : a)));
    } catch (err) {
      // The server said no: put the card back.
      setApplications((apps) => apps.map((a) => (a.id === id ? original : a)));
      setError(getErrorMessage(err));
    }
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setOverStage(null);
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (id) moveCard(id, stage);
  };

  const handleSaved = (saved) => {
    setApplications((apps) =>
      apps.some((a) => a.id === saved.id)
        ? apps.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...apps]
    );
    setModal(null);
  };

  const handleDeleted = (id) => {
    setApplications((apps) => apps.filter((a) => a.id !== id));
    setModal(null);
  };

  const query = search.trim().toLowerCase();
  const visible = query
    ? applications.filter((a) =>
        `${a.company} ${a.role} ${a.location}`.toLowerCase().includes(query)
      )
    : applications;

  if (loading) return <p className="center-note">Loading your applications...</p>;

  return (
    <div>
      <div className="board-toolbar">
        <h2>Applications ({applications.length})</h2>
        <input
          className="search"
          placeholder="Search company, role, location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn primary" onClick={() => setModal({ application: null, stage: "wishlist" })}>
          + Add application
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="board">
        {STAGES.map((stage) => {
          const cards = visible.filter((a) => a.stage === stage.value);
          return (
            <section
              key={stage.value}
              className={`column ${overStage === stage.value ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault(); // required, otherwise the browser refuses drops here
                setOverStage(stage.value);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverStage(null);
              }}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <header className="column-header">
                <span>{stage.label}</span>
                <span className="count">{cards.length}</span>
              </header>
              <div className="column-body">
                {cards.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onOpen={(a) => setModal({ application: a })}
                  />
                ))}
                {cards.length === 0 && <p className="empty">Drop cards here</p>}
              </div>
              <button
                className="add-in-column"
                onClick={() => setModal({ application: null, stage: stage.value })}
              >
                + Add
              </button>
            </section>
          );
        })}
      </div>

      {modal && (
        <ApplicationModal
          application={modal.application}
          defaultStage={modal.stage}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}