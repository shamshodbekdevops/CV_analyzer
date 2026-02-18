from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        return username

    def validate_email(self, value):
        return value.strip().lower()

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class LoginTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Supports login with either username or email while preserving JWT response format.
    """

    username = serializers.CharField(required=False)
    identifier = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        identifier = (attrs.get("identifier") or attrs.get("username") or "").strip()
        password = attrs.get("password", "")

        if not identifier:
            raise serializers.ValidationError({"username": "Username or email is required."})
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})

        normalized_username = identifier
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).only("username").first()
            if user:
                normalized_username = user.username

        attrs["username"] = normalized_username
        attrs["password"] = password
        data = super().validate(attrs)
        data["username"] = self.user.username
        data["email"] = self.user.email or ""
        return data
