using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Infrastructure.Persistence.Seeders;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        await db.Database.MigrateAsync();

        if (!await db.Tenants.IgnoreQueryFilters().AnyAsync())
        {
            logger.LogInformation("Seeding demo data...");
            await SeedDemoTenantsAsync(db, hasher);
            logger.LogInformation("Demo data seeded successfully.");
        }
    }

    private static async Task SeedDemoTenantsAsync(ApplicationDbContext db, IPasswordHasher hasher)
    {
        // ── Tenant: Math Masters Academy ──────────────────────────────────────
        var mathTenant = Tenant.Create("Math Masters Academy", "math-masters", "tutoring", PlanTier.Pro);
        mathTenant.UpdateSettings(new TenantSettings
        {
            Currency = "TRY",
            TimeZone = "Europe/Istanbul",
            DefaultSessionDurationMinutes = 60,
            CancellationWindowHours = 24,
            PrimaryColor = "#4F46E5"
        });

        await db.Tenants.AddAsync(mathTenant);
        await db.SaveChangesAsync();

        // ── Teacher 1: Sevda — ilkokul & ortaokul ────────────────────────────
        var sevdaUser = User.Create(
            mathTenant.Id,
            "sevda@math-masters.com",
            hasher.Hash("Demo1234!"),
            "Sevda", "Öztürk",
            UserRole.ServiceProvider);

        await db.Users.AddAsync(sevdaUser);
        await db.SaveChangesAsync();

        var sevdaProvider = Domain.Entities.ServiceProvider.Create(mathTenant.Id, sevdaUser.Id);
        sevdaProvider.UpdateProfile(
            bio: "İlkokul ve ortaokul öğrencilerine matematik öğretmekten büyük keyif alıyorum. " +
                 "Temel kavramları eğlenceli yöntemlerle aktararak öğrencilerde kalıcı öğrenme sağlıyorum. " +
                 "Her çocuğun kendi hızında, özgüvenle ilerleyebileceğine inanıyorum.",
            specializations: ["İlkokul Matematiği", "Ortaokul Matematiği", "Sayılar & İşlemler", "Kesirler & Ondalıklar"],
            hourlyRate: 300,
            currency: "TRY");

        await db.ServiceProviders.AddAsync(sevdaProvider);
        await db.SaveChangesAsync();

        await db.Services.AddAsync(Service.Create(
            mathTenant.Id, sevdaProvider.Id,
            "İlkokul Matematik Dersi",
            "1-4. sınıf öğrencilerine sayılar, toplama, çıkarma, çarpma ve bölme konularında destek.",
            durationMinutes: 45, price: 250, currency: "TRY"));

        await db.Services.AddAsync(Service.Create(
            mathTenant.Id, sevdaProvider.Id,
            "Ortaokul Matematik Dersi",
            "5-8. sınıf matematik müfredatı; kesirler, denklemler, geometri ve olasılık.",
            durationMinutes: 60, price: 300, currency: "TRY"));

        // Sevda: Pzt–Cum 09:00–13:00
        foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
                                     DayOfWeek.Thursday, DayOfWeek.Friday })
        {
            await db.AvailabilitySlots.AddAsync(AvailabilitySlot.Create(
                mathTenant.Id, sevdaProvider.Id, day,
                new TimeOnly(9, 0), new TimeOnly(13, 0)));
        }
        await db.SaveChangesAsync();

        // ── Teacher 2: Sümeyye — DGS, KPSS, lise & üniversite hazırlık ───────
        var sümeyyeUser = User.Create(
            mathTenant.Id,
            "sumeyye@math-masters.com",
            hasher.Hash("Demo1234!"),
            "Sümeyye", "Kaya",
            UserRole.ServiceProvider);

        await db.Users.AddAsync(sümeyyeUser);
        await db.SaveChangesAsync();

        var sümeyyeProvider = Domain.Entities.ServiceProvider.Create(mathTenant.Id, sümeyyeUser.Id);
        sümeyyeProvider.UpdateProfile(
            bio: "Üniversite ve sınav hazırlık alanında 8 yıllık deneyime sahibim. " +
                 "DGS ve KPSS sınavlarında yüzlerce öğrenciyi başarıya ulaştırdım. " +
                 "Lise düzeyinden üniversite matematiğine kadar geniş bir yelpazede ders veriyorum. " +
                 "Soru çözüm odaklı, pratik ve hedefe yönelik bir öğretim anlayışım var.",
            specializations: ["DGS Matematik", "KPSS Matematik", "Lise Hazırlık", "Üniversite Hazırlık (YKS/AYT)"],
            hourlyRate: 450,
            currency: "TRY");

        await db.ServiceProviders.AddAsync(sümeyyeProvider);
        await db.SaveChangesAsync();

        await db.Services.AddAsync(Service.Create(
            mathTenant.Id, sümeyyeProvider.Id,
            "DGS Matematik Hazırlık",
            "Dikey Geçiş Sınavı'na özel konu anlatımı ve soru çözümü. Sayısal bölüm odaklı.",
            durationMinutes: 60, price: 450, currency: "TRY"));

        await db.Services.AddAsync(Service.Create(
            mathTenant.Id, sümeyyeProvider.Id,
            "KPSS Matematik Hazırlık",
            "KPSS Genel Yetenek / Matematik bölümü için strateji ve soru bankası çalışması.",
            durationMinutes: 60, price: 400, currency: "TRY"));

        await db.Services.AddAsync(Service.Create(
            mathTenant.Id, sümeyyeProvider.Id,
            "Lise & Üniversite Hazırlık",
            "YKS/AYT matematik; türev, integral, analitik geometri ve istatistik konuları.",
            durationMinutes: 60, price: 430, currency: "TRY"));

        // Sümeyye: Salı-Çarşamba-Cumartesi 10:00–18:00, Perşembe-Cuma 14:00–20:00
        foreach (var day in new[] { DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Saturday })
        {
            await db.AvailabilitySlots.AddAsync(AvailabilitySlot.Create(
                mathTenant.Id, sümeyyeProvider.Id, day,
                new TimeOnly(10, 0), new TimeOnly(18, 0)));
        }
        foreach (var day in new[] { DayOfWeek.Thursday, DayOfWeek.Friday })
        {
            await db.AvailabilitySlots.AddAsync(AvailabilitySlot.Create(
                mathTenant.Id, sümeyyeProvider.Id, day,
                new TimeOnly(14, 0), new TimeOnly(20, 0)));
        }

        await db.SaveChangesAsync();

        // ── Demo Client user ─────────────────────────────────────────────────
        var clientUser = User.Create(
            mathTenant.Id,
            "ogrenci@math-masters.com",
            hasher.Hash("Demo1234!"),
            "Ali", "Yılmaz",
            UserRole.Client);

        await db.Users.AddAsync(clientUser);
        await db.SaveChangesAsync();

        // ── MindSpace Tenant (psikoloji — şimdilik sadece tenant) ──────────────
        var psychTenant = Tenant.Create("MindSpace Counseling", "mindspace", "psychology", PlanTier.Pro);
        psychTenant.UpdateSettings(new TenantSettings
        {
            Currency = "TRY",
            TimeZone = "Europe/Istanbul",
            DefaultSessionDurationMinutes = 50,
            CancellationWindowHours = 48,
            PrimaryColor = "#059669"
        });

        await db.Tenants.AddAsync(psychTenant);
        await db.SaveChangesAsync();
    }
}
