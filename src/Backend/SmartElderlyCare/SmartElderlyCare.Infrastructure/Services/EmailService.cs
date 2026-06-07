using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using SmartElderlyCare.Application.Common.Settings;
using SmartElderlyCare.Application.Interfaces;
using System;
using System.Threading.Tasks;

namespace SmartElderlyCare.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        // If SMTP isn't configured, we just log and exit gracefully (or you can throw).
        if (string.IsNullOrEmpty(_emailSettings.SmtpHost))
        {
            Console.WriteLine($"[EmailService] SMTP not configured. Would have sent reset link to {toEmail}: {resetLink}");
            return;
        }

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = "Reset Your Password - SilverNest";

        string htmlBody = $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }}
                .btn {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>SilverNest Password Reset</h2>
                </div>
                <div class='content'>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. You can reset it by clicking the button below:</p>
                    <div style='text-align: center;'>
                        <a href='{resetLink}' class='btn'>Reset Password</a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #2563eb;'>{resetLink}</p>
                    <p>If you did not request this reset, please ignore this email.</p>
                    <br/>
                    <p>Best regards,<br/>The SilverNest Team</p>
                </div>
            </div>
        </body>
        </html>";

        email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

        using var smtp = new SmtpClient();
        
        // Connect and send
        await smtp.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPass);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
}
