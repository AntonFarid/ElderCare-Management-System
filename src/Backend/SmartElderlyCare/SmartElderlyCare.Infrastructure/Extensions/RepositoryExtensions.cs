using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;
using SmartElderlyCare.Infrastructure.Data.Repositories;

namespace SmartElderlyCare.Infrastructure.Extensions;

/// <summary>
/// Extension methods for registering repository services
/// </summary>
public static class RepositoryExtensions
{
    public static IServiceCollection AddRepositoryLayer(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register specific repositories
        services.AddScoped<IDailyReportRepository, DailyReportRepository>();
        services.AddScoped<IElderlyRepository, ElderlyRepository>();

        return services;
    }
}