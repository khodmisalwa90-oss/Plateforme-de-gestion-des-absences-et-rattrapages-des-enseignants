import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to: str, subject: str, body: str) -> bool:
    """
    Sends an email using the SMTP settings in .env with an HTML template.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("=" * 40)
        print("MOCK EMAIL SENT (SMTP credentials not configured)")
        print(f"To: {to}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print("=" * 40)
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to

    html_body = f"""
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 24px;">Plateforme de Gestion des Absences</h2>
            <p style="color: #64748b; margin-top: 5px; font-size: 14px;">Institut Supérieur des Études Technologiques de Tozeur</p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="white-space: pre-wrap; margin: 0; font-size: 15px;">{body}</p>
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 0;">Cet email a été généré automatiquement par la plateforme.</p>
          <p style="margin: 5px 0 0 0;">Merci de ne pas y répondre directement.</p>
        </div>
      </body>
    </html>
    """
    
    part1 = MIMEText(body, "plain")
    part2 = MIMEText(html_body, "html")
    
    msg.attach(part1)
    msg.attach(part2)

    try:
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to, msg.as_string())
        server.quit()
        print(f"Email successfully sent to {to}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to}: {str(e)}")
        return False
