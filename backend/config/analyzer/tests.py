from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from applications.models import Application

from .scoring import analyze
from .skills import extract_skills

User = get_user_model()
PASSWORD = "Str0ng-Pass!23"

RESUME = (
    "Python developer with Django, REST API, SQL, scikit-learn, pandas, React and Git "
    "experience. Built machine learning projects."
)
JOB = (
    "We need a Python developer with Django, SQL, React, Docker and AWS. "
    "Experience with REST API and Git is required."
)


class SkillExtractionTests(SimpleTestCase):
    def test_java_is_not_found_inside_javascript(self):
        self.assertEqual(extract_skills("Experienced in JavaScript and Node.js"), {"javascript", "node.js"})

    def test_sql_is_not_found_inside_mysql(self):
        self.assertEqual(extract_skills("I use MySQL daily"), {"mysql"})

    def test_symbol_skills(self):
        self.assertEqual(extract_skills("Skilled in C++, C# and Python."), {"c++", "c#", "python"})

    def test_aliases_map_to_one_name(self):
        self.assertEqual(extract_skills("used sklearn and scikit learn"), {"scikit-learn"})


class ScoringTests(SimpleTestCase):
    def test_matched_and_missing_skills(self):
        result = analyze(RESUME, JOB)
        for skill in ["python", "django", "sql", "react", "git", "rest api"]:
            self.assertIn(skill, result["matched_skills"])
        self.assertEqual(result["missing_skills"], ["aws", "docker"])

    def test_identical_text_scores_100(self):
        self.assertEqual(analyze(RESUME, RESUME)["match_score"], 100.0)

    def test_unrelated_text_scores_low(self):
        job = "Registered nurse needed for patient care in a busy hospital ward."
        self.assertLess(analyze(RESUME, job)["match_score"], 20)

    def test_score_is_between_0_and_100(self):
        result = analyze(RESUME, JOB)
        self.assertGreaterEqual(result["match_score"], 0)
        self.assertLessEqual(result["match_score"], 100)


class AnalyzerApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", "alice@example.com", PASSWORD)
        self.bob = User.objects.create_user("bob", "bob@example.com", PASSWORD)
        self.client.force_authenticate(user=self.alice)

    def upload(self, name="resume.txt", text=RESUME):
        file = SimpleUploadedFile(name, text.encode(), content_type="text/plain")
        return self.client.post("/api/resumes/", {"file": file}, format="multipart")

    def test_upload_resume(self):
        response = self.upload()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["filename"], "resume.txt")
        self.assertGreater(response.data["char_count"], 0)

    def test_rejects_unsupported_file_type(self):
        self.assertEqual(self.upload(name="resume.exe").status_code, 400)

    def test_rejects_almost_empty_file(self):
        self.assertEqual(self.upload(text="too short").status_code, 400)

    def test_upload_requires_a_file(self):
        self.assertEqual(self.client.post("/api/resumes/", {}, format="multipart").status_code, 400)

    def test_analyze_with_job_description(self):
        resume_id = self.upload().data["id"]
        response = self.client.post(
            "/api/analyze/", {"resume": resume_id, "job_description": JOB}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("python", response.data["matched_skills"])
        self.assertEqual(response.data["missing_skills"], ["aws", "docker"])

    def test_analyze_uses_job_description_saved_on_application(self):
        resume_id = self.upload().data["id"]
        application = Application.objects.create(
            user=self.alice, company="X", role="Y", job_description=JOB
        )
        response = self.client.post(
            "/api/analyze/", {"resume": resume_id, "application": application.id}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["application"], application.id)

    def test_analyze_needs_a_job_description(self):
        resume_id = self.upload().data["id"]
        response = self.client.post("/api/analyze/", {"resume": resume_id}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("job_description", response.data)

    def test_cannot_analyze_another_users_resume(self):
        resume_id = self.upload().data["id"]
        self.client.force_authenticate(user=self.bob)
        response = self.client.post(
            "/api/analyze/", {"resume": resume_id, "job_description": JOB}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("resume", response.data)

    def test_analysis_history_filtered_by_application(self):
        resume_id = self.upload().data["id"]
        application = Application.objects.create(
            user=self.alice, company="X", role="Y", job_description=JOB
        )
        self.client.post("/api/analyze/", {"resume": resume_id, "application": application.id}, format="json")
        self.client.post("/api/analyze/", {"resume": resume_id, "job_description": JOB}, format="json")
        everything = self.client.get("/api/analyses/")
        filtered = self.client.get(f"/api/analyses/?application={application.id}")
        self.assertEqual(everything.data["count"], 2)
        self.assertEqual(filtered.data["count"], 1)

    def test_delete_resume(self):
        resume_id = self.upload().data["id"]
        self.assertEqual(self.client.delete(f"/api/resumes/{resume_id}/").status_code, 204)
        self.assertEqual(self.client.get("/api/resumes/").data["count"], 0)