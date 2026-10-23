using bek.Data;
using bek.Hubs;
using bek.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtKey =
    builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT ključ nije podešen."
    );
}

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme
)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer =
                builder.Configuration["Jwt:Issuer"],

            ValidAudience =
                builder.Configuration["Jwt:Audience"],

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)
                ),

            ClockSkew = TimeSpan.Zero
        };

    // JWT se čita iz HttpOnly cookie-ja.
    options.Events = new JwtBearerEvents
    {

        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue(
                    "intertoto_admin_session",
                    out var token)
                && !string.IsNullOrWhiteSpace(token))
            {
                context.Token = token;
            }
            else
            {
                // Ne dozvoljavamo rezervno čitanje Bearer tokena
                // iz Authorization zaglavlja.
                context.NoResult();
            }

            return Task.CompletedTask;
        }

    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers();

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

builder.Services.AddScoped<MatchService>();
builder.Services.AddScoped<StandingsService>();
builder.Services.AddScoped<PlayerStatisticsService>();
builder.Services.AddScoped<MatchLineupService>();
builder.Services.AddScoped<MatchDetailsService>();
builder.Services.AddScoped<CompetitionCascadeDeleteService>();
builder.Services.AddScoped<ImageStorageService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AdminInitializationService>();
builder.Services.AddScoped<PublicStatisticsService>();
builder.Services.AddScoped<PublicStandingsService>();
builder.Services.AddScoped<PublicResultsService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseCors("AngularClient");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<LiveMatchHub>("/hubs/live-match");

using (var scope = app.Services.CreateScope())
{
    var adminInitializationService =
        scope.ServiceProvider
            .GetRequiredService<AdminInitializationService>();

    await adminInitializationService.InitializeAsync();
}

app.Run();