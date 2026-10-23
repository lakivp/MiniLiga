using bek.Data;
using bek.Models;

using Microsoft.EntityFrameworkCore;

namespace bek.Services;

public class AdminInitializationService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminInitializationService> _logger;

    public AdminInitializationService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<AdminInitializationService> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        using var scope =
            _serviceProvider.CreateScope();

        var context =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var adminExists =
            await context.Admins.AnyAsync();

        if (adminExists)
        {
            _logger.LogInformation(
                "Admin nalog već postoji. Inicijalizacija nije potrebna."
            );

            return;
        }

        var email =
            _configuration["AdminInitialization:Email"];

        var password =
            _configuration["AdminInitialization:Password"];

        var name =
            _configuration["AdminInitialization:Name"];

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException(
                "AdminInitialization:Email nije podešen."
            );
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "AdminInitialization:Password nije podešen."
            );
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            name = "Administrator";
        }

        var passwordHash =
            BCrypt.Net.BCrypt.HashPassword(password);

        var admin = new Admin
        {
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Name = name.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Admins.Add(admin);

        await context.SaveChangesAsync();

        _logger.LogInformation(
            "Početni admin nalog je uspešno kreiran: {Email}",
            admin.Email
        );
    }
}