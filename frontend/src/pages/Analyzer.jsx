import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import ResultCard from "../components/ResultCard";

export default function Analyzer() {
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [resumeId, setResumeId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/resumes/"),
      api.get("/applications/", { params: { page_size: 200 } }),
      api.get("/analyses/", { params: { page_size: 200 } }),
    ])
      .then(([resumeRes, appRes, analysisRes]) => {
        setResumes(resumeRes.data.results);
        setApplications(appRes.data.results);
        setAnalyses(analysisRes.data.results);
        if (resumeRes.data.results.length > 0) {
          setResumeId(String(resumeRes.data.results[0].id)); // newest first
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const data = new FormData();
    data.append("file", file); // the key must be "file", the backend reads request.FILES["file"]

    try {
      const res = await api.post("/resumes/", data);
      setResumes((list) => [res.data, ...list]);
      setResumeId(String(res.data.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = ""; // lets you pick the same file again
    }
  };

  const handleDeleteResume = async (resume) => {
    if (!window.confirm(`Delete ${resume.filename}? Its saved analyses are deleted too.`)) return;
    try {
      await api.delete(`/resumes/${resume.id}/`);
      const remaining = resumes.filter((r) => r.id !== resume.id);
      setResumes(remaining);
      setAnalyses((list) => list.filter((a) => a.resume !== resume.id));
      if (result && result.resume === resume.id) setResult(null);
      if (String(resume.id) === resumeId) {
        setResumeId(remaining.length > 0 ? String(remaining[0].id) : "");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleApplicationChange = (e) => {
    const id = e.target.value;
    setApplicationId(id);
    const application = applications.find((a) => String(a.id) === id);
    if (application) setJobDescription(application.job_description);
  };

  const handleAnalyze = async () => {
    setError("");
    if (!resumeId) {
      setError("Upload and select a resume first.");
      return;
    }
    setAnalyzing(true);
    const payload = { resume: Number(resumeId), job_description: jobDescription };
    if (applicationId) payload.application = Number(applicationId);

    try {
      const res = await api.post("/analyze/", payload);
      setResult(res.data);
      setAnalyses((list) => [res.data, ...list]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const applicationLabel = (id) => {
    const app = applications.find((a) => a.id === id);
    return app ? `${app.role} at ${app.company}` : "Pasted job description";
  };

  if (loading) return <p className="center-note">Loading...</p>;

  return (
    <div>
      <h2>Resume analyzer</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="analyzer-grid">
        <div className="analyzer-left">
          <section className="panel">
            <h3>1. Your resume</h3>
            <label className="upload-label">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            <p className="muted small">PDF, DOCX or TXT, up to 5 MB. Scanned image PDFs are not supported.</p>
            {uploading && <p className="muted">Reading your resume...</p>}

            {resumes.length === 0 ? (
              <p className="muted">No resume uploaded yet.</p>
            ) : (
              <ul className="resume-list">
                {resumes.map((resume) => (
                  <li key={resume.id}>
                    <label className="resume-row">
                      <input
                        type="radio"
                        name="resume"
                        checked={String(resume.id) === resumeId}
                        onChange={() => setResumeId(String(resume.id))}
                      />
                      <span className="resume-name">{resume.filename}</span>
                    </label>
                    <button className="link-btn" onClick={() => handleDeleteResume(resume)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h3>2. Job description</h3>
            <label>
              Use a saved application (optional)
              <select value={applicationId} onChange={handleApplicationChange}>
                <option value="">- None, I will paste one -</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.role} - {app.company}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Job description
              <textarea
                rows={9}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </label>
            <button className="btn primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? "Analyzing..." : "Analyze match"}
            </button>
          </section>
        </div>

        <div className="analyzer-right">
          {result ? (
            <ResultCard analysis={result} />
          ) : (
            <section className="panel">
              <h3>Result</h3>
              <p className="muted">Pick a resume, add a job description and press "Analyze match".</p>
            </section>
          )}

          <section className="panel">
            <h3>History</h3>
            {analyses.length === 0 ? (
              <p className="muted">Your analyses will appear here.</p>
            ) : (
              <ul className="history-list">
                {analyses.slice(0, 15).map((analysis) => (
                  <li key={analysis.id}>
                    <button className="history-item" onClick={() => setResult(analysis)}>
                      <span className="history-score">{Math.round(analysis.match_score)}%</span>
                      <span className="history-text">
                        {applicationLabel(analysis.application)}
                        <small className="muted">
                          {analysis.resume_filename} | {new Date(analysis.created_at).toLocaleString()}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}