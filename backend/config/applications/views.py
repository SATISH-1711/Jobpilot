from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.utils import notify

from .models import Application, Stage, StatusHistory
from .serializers import ApplicationSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["company", "role", "location"]
    ordering_fields = ["created_at", "updated_at", "deadline", "company", "position"]

    def get_queryset(self):
        queryset = Application.objects.filter(user=self.request.user).prefetch_related("history")
        stage = self.request.query_params.get("stage")
        if stage:
            if stage not in Stage.values:
                raise ValidationError({"stage": f"Must be one of: {', '.join(Stage.values)}."})
            queryset = queryset.filter(stage=stage)
        return queryset

    def perform_create(self, serializer):
        application = serializer.save(user=self.request.user)
        StatusHistory.objects.create(
            application=application, from_stage="", to_stage=application.stage
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_stage = instance.stage
        old_deadline = instance.deadline
        data = serializer.validated_data
        extra = {}

        new_stage = data.get("stage", old_stage)
        if new_stage == Stage.APPLIED and not (data.get("applied_date") or instance.applied_date):
            extra["applied_date"] = timezone.localdate()
        if "deadline" in data and data["deadline"] != old_deadline:
            extra["reminder_sent"] = False

        application = serializer.save(**extra)

        if application.stage != old_stage:
            StatusHistory.objects.create(
                application=application, from_stage=old_stage, to_stage=application.stage
            )
            if application.stage in (Stage.INTERVIEW, Stage.OFFER):
                notify(
                    application.user,
                    f"{application.company} - {application.role} moved to "
                    f"{application.get_stage_display()}.",
                )


class DashboardStatsView(APIView):
    def get(self, request):
        applications = Application.objects.filter(user=request.user)
        total = applications.count()

        by_stage = {stage: 0 for stage in Stage.values}
        for row in applications.values("stage").annotate(count=Count("id")):
            by_stage[row["stage"]] = row["count"]

        applied_total = total - by_stage[Stage.WISHLIST]
        responded = by_stage[Stage.INTERVIEW] + by_stage[Stage.OFFER] + by_stage[Stage.REJECTED]
        response_rate = round(responded / applied_total * 100, 1) if applied_total else 0.0

        today = timezone.localdate()
        this_week = today - timedelta(days=today.weekday())
        week_starts = [this_week - timedelta(weeks=i) for i in range(7, -1, -1)]
        counts = {start: 0 for start in week_starts}
        window_start = week_starts[0]
        for applied_date, created_at in applications.filter(
            Q(applied_date__gte=window_start) | Q(created_at__date__gte=window_start)
        ).values_list("applied_date", "created_at"):
            day = applied_date or created_at.date()
            start = day - timedelta(days=day.weekday())
            if start in counts:
                counts[start] += 1
        weekly = [{"week_start": start.isoformat(), "count": counts[start]} for start in week_starts]

        upcoming = (
            applications.filter(deadline__gte=today)
            .exclude(stage__in=[Stage.OFFER, Stage.REJECTED])
            .order_by("deadline")[:5]
        )
        upcoming_deadlines = [
            {"id": a.id, "company": a.company, "role": a.role, "deadline": a.deadline.isoformat()}
            for a in upcoming
        ]

        return Response(
            {
                "total": total,
                "by_stage": by_stage,
                "response_rate": response_rate,
                "weekly": weekly,
                "upcoming_deadlines": upcoming_deadlines,
            }
        )