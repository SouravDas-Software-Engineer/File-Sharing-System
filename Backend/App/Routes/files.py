# email_utils.py
import os
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
# this is the forgot password needed details and verification - start
def send_password_reset_email(to_email: str, otp: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD") 
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Online File Sharing- OTP for Password Change"
    
    # Add the OTP to the email body
    body = f"""Hello,

We received a request to reset the password for your Online File Sharing System account. 

Your One-Time Password (OTP) is: {otp}

Please enter this code on the verification page to create a new password. For your security, this code will expire in 10 minutes and should not be shared with anyone.

If you did not request a password reset, you can safely ignore this email. Your files and account remain secure.

Best,
The Online File Sharing System Team
"""
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send email to {to_email}. Error: {e}")

# end

#user greetings

def send_welcome_email(to_email: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD") 
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Welcome to Online File Sharing System!"
    
    body = f"""Hello!

Welcome to the Online File Sharing System. We are excited to have you on board.

Your account has been successfully created. You can now log in to securely store, manage, and share your files.

If you ever forget your password, you can easily reset it from the login page.

Best regards,
The Online File Sharing System Team
"""
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send welcome email to {to_email}. Error: {e}")
<<<<<<< HEAD
=======


def send_password_change_confirmation(to_email: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD") 
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Your Password Has Been Changed"
    
    body = """Hello,

This is a confirmation that the password for your Online File Sharing System account was recently changed.

If you made this change, you can safely ignore this email. If you did not make this change, please reset your password immediately or contact support.

Best,
The Online File Sharing System Team
"""
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send confirmation email to {to_email}. Error: {e}")

def send_delete_account_otp(to_email: str, otp: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD") 
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Account Deletion Verification Code"
    
    body = f"""Hello,

We received a request to permanently delete your account.

Your verification code is: {otp}

If you did not request this, please ignore this email and your account will remain secure.

Best,
The Online File Sharing System Team
"""
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send deletion OTP to {to_email}. Error: {e}")
>>>>>>> dev
