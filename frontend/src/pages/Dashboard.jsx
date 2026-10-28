import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { STAGES } from "../constants";

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}

function shortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function daysLeft(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(`${value}T00:00:00`) - today) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/stats/")
      .then((res) => setStats(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!stats) return <p className="center-note">Loading dashboard...</p>;

  if (stats.total === 0) {
    return (
      <div className="panel">
        <h2>Dashboard</h2>
        <p className="muted">
          No applications yet. <Link to="/">Add your first one on the board</Link> and your
          numbers will appear here.
        </p>
      </div>
    );
  }

  const maxStage = Math.max(...Object.values(stats.by_stage), 1);
  const maxWeek = Math.max(...stats.weekly.map((w) => w.count), 1);
  const hasAverage = "average_match_score" in stats; // only present if you added the optional Stage 4 step

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="stat-grid">
        <StatCard label="Total applications" value={stats.total} />
        <StatCard label="Interviews" value={stats.by_stage.interview} />
        <StatCard label="Offers" value={stats.by_stage.offer} />
        <StatCard
          label="Response rate"
          value={`${stats.response_rate}%`}
          hint="Of jobs you applied to, how many replied"
        />
        {hasAverage && (
          <StatCard
            label="Avg. resume match"
            value={stats.average_match_score === null ? "-" : `${stats.average_match_score}%`}
            hint="From the resume analyzer"
          />
        )}
      </div>

      <div className="dash-grid">
        <section className="panel">
          <h3>Applications by stage</h3>
          <div className="hbars">
            {STAGES.map((stage) => {
              const count = stats.by_stage[stage.value];
              return (
                <div className="hbar-row" key={stage.value}>
                  <span className="hbar-label">{stage.label}</span>
                  <div className="hbar-track">
                    <div className="hbar-fill" style={{ width: `${(count / maxStage) * 100}%` }} />
                  </div>
                  <span className="hbar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <h3>Applications per week</h3>
          <div className="vbars">
            {stats.weekly.map((week) => (
              <div className="vbar-col" key={week.week_start}>
                <span className="vbar-count">{week.count}</span>
                <div className="vbar-track">
                  <div className="vbar-fill" style={{ height: `${(week.count / maxWeek) * 100}%` }} />
                </div>
                <span className="vbar-label">{shortDate(week.week_start)}</span>
              </div>
            ))}
          </div>
          <p className="muted small">Weeks start on Monday. Last 8 weeks.</p>
        </section>

        <section className="panel">
          <h3>Upcoming deadlines</h3>
          {stats.upcoming_deadlines.length === 0 ? (
            <p className="muted">No upcoming deadlines.</p>
          ) : (
            <ul className="deadline-list">
              {stats.upcoming_deadlines.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.role}</strong>
                    <div className="muted small">{item.company}</div>
                  </div>
                  <div className="deadline-when">
                    <strong>{shortDate(item.deadline)}</strong>
                    <div className="muted small">{daysLeft(item.deadline)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}