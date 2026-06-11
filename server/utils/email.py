"""
Email service — send transactional emails via the Resend SDK.
"""
import resend

from config import settings


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password-reset link to the given email address."""
    resend.api_key = settings.RESEND_API_KEY

    reset_url = f"{settings.FRONTEND_URL}/reset-password.html?token={reset_token}"

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "RepoAuditor — Reset Your Password",
            "html": (
                f"<h2>Password Reset Request</h2>"
                f"<p>Click the link below to reset your password. "
                f"This link expires in {settings.RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>"
                f'<p><a href="{reset_url}" style="'
                f"display:inline-block;padding:12px 24px;"
                f"background:#2563eb;color:#fff;border-radius:8px;"
                f'text-decoration:none;font-weight:600;">Reset Password</a></p>'
                f"<p>If you didn't request this, you can safely ignore this email.</p>"
                f'<br><p style="color:#64748b;font-size:13px;">— RepoAuditor Team</p>'
            ),
        }
    )


def send_contact_email(
    from_name: str, from_email: str, subject: str, message: str
) -> None:
    """Forward a contact-form submission to the team inbox."""
    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [settings.EMAIL_FROM],  # Deliver to the team inbox
            "reply_to": from_email,
            "subject": f"[RepoAuditor Contact] {subject}",
            "html": (
                f"<h2>New Contact Form Submission</h2>"
                f"<p><strong>Name:</strong> {from_name}</p>"
                f"<p><strong>Email:</strong> {from_email}</p>"
                f"<p><strong>Subject:</strong> {subject}</p>"
                f"<hr>"
                f"<p>{message}</p>"
                f'<br><p style="color:#64748b;font-size:13px;">— Sent from repoauditor.com contact form</p>'
            ),
        }
    )
