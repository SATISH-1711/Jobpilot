import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .skills import extract_skills

# How the final score is mixed. Skill coverage matters more than raw wording overlap.
SIMILARITY_WEIGHT = 0.4
SKILL_WEIGHT = 0.6
# A resume and a job description rarely exceed ~0.5 cosine similarity (they use
# different vocabulary), so 0.5 counts as a "full" similarity score. Tunable heuristic.
SIMILARITY_CEILING = 0.5


def clean_text(text):
    text = text.lower()
    text = re.sub(r"https?://\S+|\S+@\S+", " ", text)  # drop URLs and emails
    return re.sub(r"\s+", " ", text).strip()


def text_similarity(resume_text, jd_text):
    """Cosine similarity (0 to 1) between the TF-IDF vectors of the two texts."""
    resume_clean, jd_clean = clean_text(resume_text), clean_text(jd_text)
    if not resume_clean or not jd_clean:
        return 0.0

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
    try:
        matrix = vectorizer.fit_transform([resume_clean, jd_clean])
    except ValueError:  # e.g. the texts contain only stop words
        return 0.0
    return float(cosine_similarity(matrix[0], matrix[1])[0][0])


def analyze(resume_text, jd_text):
    similarity = text_similarity(resume_text, jd_text)
    similarity_pct = min(similarity / SIMILARITY_CEILING, 1.0) * 100

    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)
    matched = resume_skills & jd_skills
    missing = jd_skills - resume_skills

    if jd_skills:
        skill_pct = len(matched) / len(jd_skills) * 100
        score = SIMILARITY_WEIGHT * similarity_pct + SKILL_WEIGHT * skill_pct
    else:
        skill_pct = None  # no recognizable skills in the job description
        score = similarity_pct

    return {
        "match_score": round(score, 1),
        "similarity_score": round(similarity_pct, 1),
        "skill_score": None if skill_pct is None else round(skill_pct, 1),
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
    }