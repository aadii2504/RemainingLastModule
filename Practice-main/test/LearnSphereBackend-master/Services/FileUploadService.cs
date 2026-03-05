using MyProject.Api.Services.Interfaces;

namespace MyProject.Api.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _hostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly string[] AllowedVideoExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm"];
    private readonly string[] AllowedAudioExtensions = [".mp3", ".wav", ".aac", ".flac"];
    private readonly string[] AllowedDocumentExtensions = [".pdf", ".docx", ".pptx", ".xlsx"];
    private readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 500 * 1024 * 1024; // 500 MB

    public FileUploadService(IWebHostEnvironment hostEnvironment, IConfiguration configuration)
    {
        _hostEnvironment = hostEnvironment;
        _configuration = configuration;
    }

    public async Task<(bool success, string? fileUrl, string? fileName, long fileSize, string? error)> UploadFileAsync(
        IFormFile file,
        string contentType,
        int? courseId = null
    )
    {
        try
        {
            // Validate file
            if (file == null || file.Length == 0)
                return (false, null, null, 0, "File is empty");

            if (file.Length > MaxFileSize)
                return (false, null, null, 0, $"File size exceeds maximum limit of {MaxFileSize / (1024 * 1024)} MB");

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var originalFileName = file.FileName;

            // Validate file type based on content type
            if (!IsValidFileType(fileExtension, contentType))
                return (false, null, null, 0, $"File type '{fileExtension}' is not allowed for content type '{contentType}'");

            // Create upload directory
            string uploadDir;
            string relativePath;
            if (courseId.HasValue)
            {
                uploadDir = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "courses", courseId.Value.ToString());
                relativePath = $"/uploads/courses/{courseId.Value}";
            }
            else
            {
                uploadDir = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "live-sessions");
                relativePath = $"/uploads/live-sessions";
            }

            if (!Directory.Exists(uploadDir))
                Directory.CreateDirectory(uploadDir);

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}_{DateTime.UtcNow.Ticks}{fileExtension}";
            var filePath = Path.Combine(uploadDir, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative URL
            var baseUrl = _configuration["FileUpload:BaseUrl"] ?? $"http://localhost:5267";
            var fileUrl = $"{baseUrl}{relativePath}/{uniqueFileName}";

            return (true, fileUrl, originalFileName, file.Length, null);
        }
        catch (Exception ex)
        {
            return (false, null, null, 0, $"Error uploading file: {ex.Message}");
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return false;

            // Extract relative path from URL
            var uri = new Uri(fileUrl);
            var relativePath = uri.LocalPath.TrimStart('/');
            var filePath = Path.Combine(_hostEnvironment.WebRootPath, relativePath);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    public string GetContentTypeFromMimeType(string mimeType)
    {
        return mimeType switch
        {
            var m when m.StartsWith("video/") => "video",
            var m when m.StartsWith("audio/") => "audio",
            "application/pdf" or
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" or
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => "document",
            var m when m.StartsWith("image/") => "image",
            _ => "document"
        };
    }

    private bool IsValidFileType(string fileExtension, string contentType)
    {
        return contentType.ToLowerInvariant() switch
        {
            "video" => AllowedVideoExtensions.Contains(fileExtension),
            "audio" => AllowedAudioExtensions.Contains(fileExtension),
            "document" => AllowedDocumentExtensions.Contains(fileExtension),
            "image" => AllowedImageExtensions.Contains(fileExtension),
            _ => false
        };
    }
}
