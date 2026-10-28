import ScoreGauge from "./ScoreGauge";

function verdict(score) {
  if (score >= 70) return "Strong match";
  if (score >= 40) return "Partial match";
  return "Weak match";
}

function SkillList({ title, skills, className, emptyText }) {
  return (
    <div className="skill-block">
      <h4>
        {title} ({skills.length})
      </h4>
      {skills.length === 0 ? (
        <p className="muted small">{emptyText}</p>
      ) : (
        <div className="chips">
          {skills.map((skill) => (
            <span key={skill} className={`chip ${className}`}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultCard({ analysis }) {
  return (
    <div className="panel">
      <div className="result-top">
        <ScoreGauge score={analysis.match_score} />
        <div>
          <h3>{verdict(analysis.match_score)}</h3>
          <p className="muted small">Resume: {analysis.resume_filename}</p>
          <p className="muted small">
            Wording similarity: {analysis.similarity_score}%
            {analysis.skill_score !== null && <> | Skill coverage: {analysis.skill_score}%</>}
          </p>
        </div>
      </div>

      <SkillList
        title="Matched skills"
        skills={analysis.matched_skills}
        className="good"
        emptyText="None of the skills in this job description were found in your resume."
      />
      <SkillList
        title="Missing skills"
        skills={analysis.missing_skills}
        className="bad"
        emptyText="Nothing missing. Your resume covers every skill we detected."
      />

      <p className="muted small">
        Skills are detected from a built-in list, so a skill outside that list is not counted.
        Only add skills to your resume that you genuinely have.
      </p>
    </div>
  );
}