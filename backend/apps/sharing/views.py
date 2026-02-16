from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sharing.models import ShareLink


class ShareDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        share = ShareLink.objects.select_related("resume", "resume__owner").filter(token=token).first()
        if not share:
            return Response({"detail": "Link not found."}, status=404)

        return Response(
            {
                "title": share.resume.title,
                "content": share.resume.content,
                "latest_analysis": share.resume.latest_analysis,
                "owner": share.resume.owner.username,
            }
        )
