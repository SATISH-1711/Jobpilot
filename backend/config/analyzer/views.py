from django.shortcuts import render


from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Analysis, Resume
from .parsers import ResumeParseError, extract_text
from .scoring import analyze
from .serializers import AnalysisSerializer, AnalyzeRequestSerializer, ResumeSerializer

MAX_RESUMES_PER_USER = 10


class ResumeViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ResumeSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        upload = request.FILES.get("file")
        if upload is None:
            return Response(
                {"file": "No file uploaded. Send it as form-data with the key 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if self.get_queryset().count() >= MAX_RESUMES_PER_USER:
            return Response(
                {"file": f"You can store up to {MAX_RESUMES_PER_USER} resumes. Delete an old one first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            text = extract_text(upload)
        except ResumeParseError as exc:
            return Response({"file": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        resume = Resume.objects.create(
            user=request.user, filename=upload.name[:255], extracted_text=text
        )
        return Response(self.get_serializer(resume).data, status=status.HTTP_201_CREATED)


class AnalyzeView(APIView):
    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = analyze(data["resume"].extracted_text, data["job_description"])
        analysis = Analysis.objects.create(
            user=request.user,
            resume=data["resume"],
            application=data["application"],
            job_description=data["job_description"],
            **result,
        )
        return Response(AnalysisSerializer(analysis).data, status=status.HTTP_201_CREATED)


class AnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AnalysisSerializer

    def get_queryset(self):
        queryset = Analysis.objects.filter(user=self.request.user).select_related("resume")
        application_id = self.request.query_params.get("application")
        if application_id:
            if not application_id.isdigit():
                raise ValidationError({"application": "Must be a number."})
            queryset = queryset.filter(application_id=application_id)
        return queryset