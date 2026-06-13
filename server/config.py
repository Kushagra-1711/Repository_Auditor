"""
Application configuration — loads environment variables.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

_INSECURE_JWT_DEFAULT = "change-me-in-production"


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", _INSECURE_JWT_DEFAULT)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    RESET_TOKEN_EXPIRY_MINUTES: int = 60
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8000")

    # Shared secret that n8n must include in callbacks to /api/audits/{id}/complete
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "")

    # Razorpay payment gateway credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    def validate(self) -> None:
        """Abort startup if critical secrets are missing or insecure."""
        if not self.DATABASE_URL:
            print(
                "\n❌  FATAL: DATABASE_URL is not set.\n"
                "   Set your Supabase connection string in the .env file.\n",
                file=sys.stderr,
            )
            sys.exit(1)

        if self.JWT_SECRET == _INSECURE_JWT_DEFAULT:
            print(
                "\n❌  FATAL: JWT_SECRET is set to the insecure default.\n"
                "   Set a strong random value in your .env file:\n"
                "     JWT_SECRET=$(openssl rand -hex 32)\n",
                file=sys.stderr,
            )
            sys.exit(1)

        if not self.WEBHOOK_SECRET:
            print(
                "⚠️  WARNING: WEBHOOK_SECRET is not set. "
                "The /api/audits/{id}/complete endpoint is unprotected.\n",
                file=sys.stderr,
            )

        if not self.RAZORPAY_KEY_ID or not self.RAZORPAY_KEY_SECRET:
            print(
                "⚠️  WARNING: Razorpay credentials are not set. "
                "Payment endpoints will return 503.\n",
                file=sys.stderr,
            )


settings = Settings()
