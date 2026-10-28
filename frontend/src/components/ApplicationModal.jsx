import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import { STAGES } from "../constants";

const EMPTY = {
  company: "",
  role: "",
  stage: "wishlist",
  location: "",
  salary: "",
  job_url: "",
  deadline: "",
  job_description: "",
  notes: "",
};

export default function ApplicationModal({ application, defaultStage, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(application);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          company: application.company,
          role: application.role,
          stage: application.stage,
          location: application.location,
          salary: application.salary,
          job_url: application.job_url,
          deadline: application.deadline || "",
          job_description: application.job_description,
          notes: application.notes,
        }
      : { ...EMPTY, stage: defaultStage || "wishlist" }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Close with the Escape key.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = { ...form, deadline: form.deadline || null };
    try {
      const res = isEdit
        ? await api.patch(`/applications/${application.id}/`, payload)
        : await api.post("/applications/", payload);
      onSaved(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${application.role} at ${application.company}?`)) return;
    try {
      await api.delete(`/applications/${application.id}/`);
      onDeleted(application.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit application" : "New application"}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        <div className="form-grid">
          <label>
            Company *
            <input name="company" value={form.company} onChange={handleChange} required autoFocus />
          </label>
          <label>
            Role *
            <input name="role" value={form.role} onChange={handleChange} required />
          </label>
          <label>
            Stage
            <select name="stage" value={form.stage} onChange={handleChange}>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Deadline
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} />
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <label>
            Salary
            <input name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. 4-6 LPA" />
          </label>
        </div>

        <label>
          Job link
          <input type="url" name="job_url" value={form.job_url} onChange={handleChange} placeholder="https://..." />
        </label>
        <label>
          Job description
          <textarea
            name="job_description"
            rows={5}
            value={form.job_description}
            onChange={handleChange}
            placeholder="Paste the job description here. The resume analyzer will use it."
          />
        </label>
        <label>
          Notes
          <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
        </label>

        <div className="modal-actions">
          {isEdit && (
            <button type="button" className="btn danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button className="btn primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add application"}
          </button>
        </div>
      </form>
    </div>
  );
}