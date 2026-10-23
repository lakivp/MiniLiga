using Microsoft.AspNetCore.Hosting;

namespace bek.Services;

public class ImageStorageService
{
    public const long MaxImageSize = 5 * 1024 * 1024;

    private static readonly Dictionary<string, HashSet<string>> AllowedImages =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["image/jpeg"] = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg" },
            ["image/png"] = new(StringComparer.OrdinalIgnoreCase) { ".png" },
            ["image/webp"] = new(StringComparer.OrdinalIgnoreCase) { ".webp" },
            ["image/gif"] = new(StringComparer.OrdinalIgnoreCase) { ".gif" }
        };

    private readonly IWebHostEnvironment _environment;

    public ImageStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        if (file.Length <= 0 || file.Length > MaxImageSize)
        {
            throw new InvalidDataException(
                "Slika mora biti veća od 0 i manja od 5 MB.");
        }

        var extension = Path.GetExtension(file.FileName);
        var contentType = file.ContentType;

        if (!AllowedImages.TryGetValue(contentType, out var extensions) ||
            !extensions.Contains(extension))
        {
            throw new InvalidDataException(
                "Dozvoljeni formati slika su JPG, PNG, WEBP i GIF.");
        }

        var safeFolder = folder.Trim('/', '\\');
        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var webRoot = _environment.WebRootPath ??
                      Path.Combine(_environment.ContentRootPath, "wwwroot");
        var directory = Path.Combine(webRoot, safeFolder);
        Directory.CreateDirectory(directory);

        var filePath = Path.Combine(directory, fileName);

        await using (var stream = new FileStream(
                         filePath,
                         FileMode.CreateNew,
                         FileAccess.Write,
                         FileShare.None,
                         81920,
                         useAsync: true))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return $"/{safeFolder}/{fileName}";
    }

    public void DeleteIfStored(string? imagePath, string folder)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return;
        }

        var path = imagePath;
        if (Uri.TryCreate(imagePath, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        var expectedPrefix = $"/{folder.Trim('/', '\\')}/";
        if (!normalizedPath.StartsWith(
                expectedPrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var fileName = Path.GetFileName(normalizedPath);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return;
        }

        var webRoot = _environment.WebRootPath ??
                      Path.Combine(_environment.ContentRootPath, "wwwroot");
        var filePath = Path.Combine(
            webRoot,
            folder.Trim('/', '\\'),
            fileName);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    public static string? ToPublicUrl(
        HttpRequest request,
        string? imagePath)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return null;
        }

        if (Uri.TryCreate(imagePath, UriKind.Absolute, out _))
        {
            return imagePath;
        }

        var normalizedPath = imagePath.StartsWith('/')
            ? imagePath
            : $"/{imagePath}";

        return $"{request.Scheme}://{request.Host}{request.PathBase}{normalizedPath}";
    }
}