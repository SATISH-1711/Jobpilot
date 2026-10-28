function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function ApplicationCard({ application, onOpen }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", String(application.id));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="card"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen(application)}
    >
      <div className="card-role">{application.role}</div>
      <div className="card-company">{application.company}</div>
      <div className="card-meta">
        {application.location && <span>{application.location}</span>}
        {application.salary && <span>{application.salary}</span>}
      </div>
      {application.deadline && (
        <div className="card-deadline">Due {formatDate(application.deadline)}</div>
      )}
    </div>
  );
}