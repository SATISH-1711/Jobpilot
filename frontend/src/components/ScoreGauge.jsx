export default function ScoreGauge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  const degrees = Math.min(Math.max(score, 0), 100) * 3.6;

  return (
    <div
      className="gauge"
      style={{ background: `conic-gradient(${color} ${degrees}deg, #e5e7eb 0)` }}
    >
      <div className="gauge-inner">
        <strong>{Math.round(score)}%</strong>
        <span>match</span>
      </div>
    </div>
  );
}