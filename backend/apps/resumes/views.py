import secrets

from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.resumes.models import Resume, ResumeVersion
from apps.resumes.pdf_export import build_export_filename, build_resume_pdf_bytes
from apps.resumes.serializers import ResumeSerializer
from apps.sharing.models import ShareLink


class ResumeListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Resume.objects.filter(owner=request.user).prefetch_related("versions")
        return Response(ResumeSerializer(qs, many=True).data)

    def post(self, request):
        serializer = ResumeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resume = serializer.save(owner=request.user)
        ResumeVersion.objects.create(
            resume=resume,
            content=resume.content,
            analysis_snapshot=resume.latest_analysis,
        )
        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)


class ResumeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, user, resume_id):
        return Resume.objects.filter(id=resume_id, owner=user).prefetch_related("versions").first()

    def get(self, request, resume_id):
        resume = self.get_object(request.user, resume_id)
        if not resume:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResumeSerializer(resume).data)

    def patch(self, request, resume_id):
        resume = self.get_object(request.user, resume_id)
        if not resume:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ResumeSerializer(resume, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        ResumeVersion.objects.create(
            resume=updated,
            content=updated.content,
            analysis_snapshot=updated.latest_analysis,
        )
        return Response(ResumeSerializer(updated).data)


class ResumeShareCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, resume_id):
        resume = Resume.objects.filter(id=resume_id, owner=request.user).first()
        if not resume:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        token = secrets.token_urlsafe(24)
        share = ShareLink.objects.create(resume=resume, token=token)
        return Response({"token": share.token, "url": f"/share/{share.token}"}, status=status.HTTP_201_CREATED)


class ResumePdfExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, resume_id):
        resume = Resume.objects.filter(id=resume_id, owner=request.user).select_related("owner").first()
        if not resume:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            pdf_bytes = build_resume_pdf_bytes(resume)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        filename = build_export_filename(resume.title)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
