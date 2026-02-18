from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AuthApiTests(APITestCase):
    def test_register_login_with_email_and_me(self):
        register_payload = {
            "username": "tester",
            "email": "tester@example.com",
            "password": "StrongPass123",
        }
        register_res = self.client.post("/api/auth/register", register_payload, format="json")
        self.assertEqual(register_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_res.data["username"], "tester")

        login_res = self.client.post(
            "/api/auth/login",
            {"identifier": "tester@example.com", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)
        self.assertIn("refresh", login_res.data)
        self.assertEqual(login_res.data["username"], "tester")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_res.data['access']}")
        me_res = self.client.get("/api/auth/me")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["username"], "tester")

    def test_login_with_username_still_works(self):
        User.objects.create_user(username="legacy", email="legacy@example.com", password="StrongPass123")
        login_res = self.client.post(
            "/api/auth/login",
            {"username": "legacy", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data["username"], "legacy")
