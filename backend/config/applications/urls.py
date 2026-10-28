from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import ApplicationViewSet, DashboardStatsView

router = SimpleRouter()
router.register("applications", ApplicationViewSet, basename="application")

urlpatterns = [
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
] + router.urls