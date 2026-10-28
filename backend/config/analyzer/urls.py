from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AnalysisViewSet, AnalyzeView, ResumeViewSet

router = SimpleRouter()
router.register("resumes", ResumeViewSet, basename="resume")
router.register("analyses", AnalysisViewSet, basename="analysis")

urlpatterns = [
    path("analyze/", AnalyzeView.as_view(), name="analyze"),
] + router.urls