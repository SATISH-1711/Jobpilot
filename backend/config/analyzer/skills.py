import re

# canonical skill name -> the spellings we look for in text (all lowercase)
SKILL_ALIASES = {
    # languages
    "python": ["python"],
    "java": ["java"],
    "javascript": ["javascript", "js", "es6"],
    "typescript": ["typescript"],
    "c": ["c programming", "c language"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp"],
    "go": ["golang"],
    "r": ["r programming", "r language"],
    "php": ["php"],
    "kotlin": ["kotlin"],
    "bash": ["bash", "shell scripting"],
    # frontend
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "react": ["react", "reactjs", "react.js"],
    "redux": ["redux"],
    "angular": ["angular", "angularjs"],
    "vue": ["vue", "vuejs", "vue.js"],
    "next.js": ["next.js", "nextjs"],
    "tailwind css": ["tailwind", "tailwind css"],
    "bootstrap": ["bootstrap"],
    # backend
    "django": ["django"],
    "django rest framework": ["django rest framework", "drf"],
    "flask": ["flask"],
    "fastapi": ["fastapi"],
    "node.js": ["node.js", "nodejs", "node js"],
    "express": ["express.js", "expressjs"],
    "spring boot": ["spring boot", "springboot"],
    "rest api": ["rest api", "rest apis", "restful", "restful api", "restful apis"],
    "graphql": ["graphql"],
    "microservices": ["microservices", "microservice"],
    "authentication": ["jwt", "oauth", "token authentication"],
    # databases
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "sqlite": ["sqlite"],
    "mongodb": ["mongodb", "mongo db"],
    "redis": ["redis"],
    "nosql": ["nosql"],
    # data and machine learning
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"],
    "computer vision": ["computer vision"],
    "numpy": ["numpy"],
    "pandas": ["pandas"],
    "matplotlib": ["matplotlib"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "tensorflow": ["tensorflow"],
    "keras": ["keras"],
    "pytorch": ["pytorch"],
    "opencv": ["opencv"],
    "data analysis": ["data analysis", "data analytics"],
    "data visualization": ["data visualization", "data visualisation"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "excel": ["excel", "ms excel"],
    # tools, cloud, devops
    "git": ["git"],
    "github": ["github"],
    "linux": ["linux"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure"],
    "gcp": ["gcp", "google cloud"],
    "ci/cd": ["ci/cd", "cicd", "ci cd"],
    "jenkins": ["jenkins"],
    "postman": ["postman"],
    "jira": ["jira"],
    # concepts
    "data structures": ["data structures", "dsa"],
    "algorithms": ["algorithms"],
    "oop": ["oop", "oops", "object oriented", "object-oriented"],
    "agile": ["agile", "scrum"],
    "sdlc": ["sdlc"],
    "unit testing": ["unit testing", "unit tests", "pytest", "unittest"],
    "web development": ["web development", "full stack", "full-stack", "fullstack"],
}


def _build_pattern(aliases):
    # Longest spellings first so "django rest framework" wins over "django".
    body = "|".join(re.escape(a) for a in sorted(aliases, key=len, reverse=True))
    # The skill must not be glued to other letters/digits/+/#, or to a dot before it.
    return re.compile(rf"(?<![a-z0-9+#.])(?:{body})(?![a-z0-9+#])")


_PATTERNS = {skill: _build_pattern(aliases) for skill, aliases in SKILL_ALIASES.items()}


def extract_skills(text):
    """Return the set of canonical skill names found in the text."""
    text = text.lower()
    return {skill for skill, pattern in _PATTERNS.items() if pattern.search(text)}