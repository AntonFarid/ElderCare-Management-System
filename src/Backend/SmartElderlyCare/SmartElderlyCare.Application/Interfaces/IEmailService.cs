using System.Threading.Tasks;

namespace SmartElderlyCare.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
}
