using bek.Data;
using bek.DTOs;
using bek.Models;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bek.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    private readonly IWebHostEnvironment _environment;

    private const long MaxImageSize = 5 * 1024 * 1024;

    private static readonly string[] AllowedExtensions =
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };


    public NewsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;

        _environment = environment;
    }


    // =========================================================
    // GET ALL
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NewsResponseDto>>> GetAll()
    {
        var news = await _context.News
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new NewsResponseDto
            {
                Id = x.Id,

                Title = x.Title,

                ImageUrl = x.ImageUrl,

                Content = x.Content,

                CreatedAt = x.CreatedAt,

                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(news);
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NewsResponseDto>> GetById(
        int id)
    {
        var news = await _context.News
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new NewsResponseDto
            {
                Id = x.Id,

                Title = x.Title,

                ImageUrl = x.ImageUrl,

                Content = x.Content,

                CreatedAt = x.CreatedAt,

                UpdatedAt = x.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (news == null)
        {
            return NotFound(new
            {
                message = "Vest nije pronađena."
            });
        }

        return Ok(news);
    }


    // =========================================================
    // CREATE
    // =========================================================

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<NewsResponseDto>> Create(
        [FromForm] string title,
        [FromForm] string content,
        [FromForm] IFormFile? image)
    {
        // -----------------------------------------------------
        // VALIDACIJA NASLOVA
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest(new
            {
                message = "Naslov je obavezan."
            });
        }


        // -----------------------------------------------------
        // VALIDACIJA TEKSTA
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(new
            {
                message = "Tekst vesti je obavezan."
            });
        }


        // -----------------------------------------------------
        // VALIDACIJA NASLOVA
        // -----------------------------------------------------

        title = title.Trim();


        // -----------------------------------------------------
        // UPLOAD SLIKE
        // -----------------------------------------------------

        string? imageUrl = null;


        if (image != null)
        {
            var imageResult =
                await SaveImage(image);


            if (!imageResult.Success)
            {
                return BadRequest(new
                {
                    message = imageResult.Error
                });
            }


            imageUrl =
                imageResult.ImageUrl;
        }


        // -----------------------------------------------------
        // KREIRANJE VESTI
        // -----------------------------------------------------

        var news = new News
        {
            Title = title,

            Content = content.Trim(),

            ImageUrl = imageUrl,

            CreatedAt = DateTime.UtcNow,

            UpdatedAt = null
        };


        _context.News.Add(news);

        await _context.SaveChangesAsync();


        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        var response =
            MapToDto(news);


        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = news.Id
            },
            response
        );
    }


    // =========================================================
    // UPDATE
    // =========================================================

    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<NewsResponseDto>> Update(
        int id,
        [FromForm] string title,
        [FromForm] string content,
        [FromForm] IFormFile? image)
    {
        // -----------------------------------------------------
        // PRONALAZAK VESTI
        // -----------------------------------------------------

        var news = await _context.News
            .FirstOrDefaultAsync(x => x.Id == id);


        if (news == null)
        {
            return NotFound(new
            {
                message = "Vest nije pronađena."
            });
        }


        // -----------------------------------------------------
        // VALIDACIJA
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest(new
            {
                message = "Naslov je obavezan."
            });
        }


        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(new
            {
                message = "Tekst vesti je obavezan."
            });
        }


        // -----------------------------------------------------
        // NOVA SLIKA
        // -----------------------------------------------------

        if (image != null)
        {
            var imageResult =
                await SaveImage(image);


            if (!imageResult.Success)
            {
                return BadRequest(new
                {
                    message = imageResult.Error
                });
            }


            // Stara slika se briše
            DeleteImage(news.ImageUrl);


            // Postavljamo novu
            news.ImageUrl =
                imageResult.ImageUrl;
        }


        // -----------------------------------------------------
        // UPDATE PODATAKA
        // -----------------------------------------------------

        news.Title =
            title.Trim();

        news.Content =
            content.Trim();

        news.UpdatedAt =
            DateTime.UtcNow;


        await _context.SaveChangesAsync();


        return Ok(
            MapToDto(news)
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id)
    {
        var news = await _context.News
            .FirstOrDefaultAsync(x => x.Id == id);


        if (news == null)
        {
            return NotFound(new
            {
                message = "Vest nije pronađena."
            });
        }


        // -----------------------------------------------------
        // BRIŠEMO SLIKU
        // -----------------------------------------------------

        DeleteImage(
            news.ImageUrl
        );


        // -----------------------------------------------------
        // BRIŠEMO VEST
        // -----------------------------------------------------

        _context.News.Remove(news);

        await _context.SaveChangesAsync();


        return NoContent();
    }


    // =========================================================
    // SAVE IMAGE
    // =========================================================

    private async Task<ImageSaveResult> SaveImage(
        IFormFile image)
    {
        // -----------------------------------------------------
        // PROVERA POSTOJANJA
        // -----------------------------------------------------

        if (image == null ||
            image.Length == 0)
        {
            return ImageSaveResult.Fail(
                "Slika nije ispravna."
            );
        }


        // -----------------------------------------------------
        // VELIČINA
        // -----------------------------------------------------

        if (image.Length > MaxImageSize)
        {
            return ImageSaveResult.Fail(
                "Slika ne sme biti veća od 5 MB."
            );
        }


        // -----------------------------------------------------
        // EKSTENZIJA
        // -----------------------------------------------------

        var extension =
            Path.GetExtension(
                image.FileName
            ).ToLowerInvariant();


        if (!AllowedExtensions.Contains(extension))
        {
            return ImageSaveResult.Fail(
                "Dozvoljene su samo JPG, JPEG, PNG i WEBP slike."
            );
        }


        // -----------------------------------------------------
        // FOLDER
        // -----------------------------------------------------

        var webRootPath =
            _environment.WebRootPath;


        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot"
                );
        }


        var newsFolder =
            Path.Combine(
                webRootPath,
                "news"
            );


        Directory.CreateDirectory(
            newsFolder
        );


        // -----------------------------------------------------
        // JEDINSTVENO IME
        // -----------------------------------------------------

        var fileName =
            $"{Guid.NewGuid():N}{extension}";


        var filePath =
            Path.Combine(
                newsFolder,
                fileName
            );


        // -----------------------------------------------------
        // ČUVANJE
        // -----------------------------------------------------

        await using (
            var stream =
                new FileStream(
                    filePath,
                    FileMode.Create
                )
        )
        {
            await image.CopyToAsync(
                stream
            );
        }


        // -----------------------------------------------------
        // URL
        // -----------------------------------------------------

        var imageUrl =
            $"/news/{fileName}";


        return ImageSaveResult.Ok(
            imageUrl
        );
    }


    // =========================================================
    // DELETE IMAGE
    // =========================================================

    private void DeleteImage(
        string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return;
        }


        // Sprečavamo da se prosledi nešto
        // što nije naša news putanja.

        if (!imageUrl.StartsWith(
                "/news/",
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }


        var fileName =
            Path.GetFileName(
                imageUrl
            );


        if (string.IsNullOrWhiteSpace(fileName))
        {
            return;
        }


        var webRootPath =
            _environment.WebRootPath;


        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot"
                );
        }


        var filePath =
            Path.Combine(
                webRootPath,
                "news",
                fileName
            );


        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(
                filePath
            );
        }
    }


    // =========================================================
    // MAP DTO
    // =========================================================

    private static NewsResponseDto MapToDto(
        News news)
    {
        return new NewsResponseDto
        {
            Id = news.Id,

            Title = news.Title,

            ImageUrl = news.ImageUrl,

            Content = news.Content,

            CreatedAt = news.CreatedAt,

            UpdatedAt = news.UpdatedAt
        };
    }


    // =========================================================
    // IMAGE RESULT
    // =========================================================

    private sealed class ImageSaveResult
    {
        public bool Success { get; init; }

        public string? ImageUrl { get; init; }

        public string? Error { get; init; }


        public static ImageSaveResult Ok(
            string imageUrl)
        {
            return new ImageSaveResult
            {
                Success = true,

                ImageUrl = imageUrl
            };
        }


        public static ImageSaveResult Fail(
            string error)
        {
            return new ImageSaveResult
            {
                Success = false,

                Error = error
            };
        }
    }
}