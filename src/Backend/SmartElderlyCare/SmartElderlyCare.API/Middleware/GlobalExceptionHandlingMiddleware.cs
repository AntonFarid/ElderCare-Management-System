using SmartElderlyCare.Application.Wrappers;
using System.Linq;
using System.Net;
using System.Text.Json;
using static System.Net.Mime.MediaTypeNames;

namespace SmartElderlyCare.API.Middleware;

/// <summary>
/// Global exception handling middleware to catch and format all exceptions
/// </summary>
public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred.");

        var response = context.Response;
        response.ContentType = "application/json";

        var responseWrapper = new Response<string>
        {
            Succeeded = false,
            Message = "An error occurred while processing your request."
        };

        switch (exception)
        {
            case Application.Common.Exceptions.ValidationException validationException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                responseWrapper.Message = "Validation failed.";
                responseWrapper.Errors = validationException.Errors switch
                {
                    List<string> list => list,
                    IDictionary<string, string[]> dict => dict.SelectMany(kvp => kvp.Value).ToList(),
                    _ => new List<string> { validationException.Message }
                };
                break;

            case Application.Common.Exceptions.NotFoundException notFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                responseWrapper.Message = notFoundException.Message;
                break;

            case Application.Common.Exceptions.UnauthorizedException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                responseWrapper.Message = "You are not authorized.";
                break;

            case Application.Common.Exceptions.ForbiddenException:
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                responseWrapper.Message = "You don't have permission to access this resource.";
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                responseWrapper.Message = "An internal server error occurred.";

                // In development, include exception details
                if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    responseWrapper.Errors = new List<string> { exception.Message, exception.StackTrace ?? "" };
                }
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(responseWrapper, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(jsonResponse);
    }
}