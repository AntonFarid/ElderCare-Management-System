using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.API.Extensions;
using SmartElderlyCare.API.Middleware;
using SmartElderlyCare.Application.Common.Settings;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Mappings;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Infrastructure.Data.Context;
using SmartElderlyCare.Infrastructure.Data.Seeds;
using SmartElderlyCare.Infrastructure.Extensions;
using SmartElderlyCare.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Register Repository Layer
builder.Services.AddRepositoryLayer(builder.Configuration);

// Register JWT Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

// Register AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Register Employee Service
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Register Team Leader Service
builder.Services.AddScoped<ITeamLeaderService, TeamLeaderService>();

// Register Admin Service
builder.Services.AddScoped<IAdminService, AdminService>();

// Register Family Member Service
builder.Services.AddScoped<IFamilyMemberService, FamilyMemberService>();

// Add Gemini Settings
builder.Services.Configure<GeminiSettings>(builder.Configuration.GetSection("GeminiSettings"));

// Register Gemini Service (no BaseAddress needed)
builder.Services.AddHttpClient<IGeminiService, GeminiService>();

// Register Identity
builder.Services.AddIdentity<User, Role>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Register Application Services
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddHttpContextAccessor();

// Add JWT Authentication
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization settings
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithJwt();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add global exception handling middleware
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<Role>>();

        await DatabaseSeeder.SeedAsync(context, userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();