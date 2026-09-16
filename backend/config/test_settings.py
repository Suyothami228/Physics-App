import os
os.environ.setdefault("DJANGO_SECRET_KEY", "isolated-tests-only-not-a-deployment-secret")
from .settings import *  # noqa: F403
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
