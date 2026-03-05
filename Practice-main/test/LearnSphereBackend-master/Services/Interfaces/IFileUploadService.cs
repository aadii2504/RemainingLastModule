namespace MyProject.Api.Services.Interfaces;

public interface IFileUploadService
{
    Task<(bool success, string? fileUrl, string? fileName, long fileSize, string? error)> UploadFileAsync(
        IFormFile file,
        string contentType,
        int? courseId = null
    );

    Task<bool> DeleteFileAsync(string fileUrl);

    string GetContentTypeFromMimeType(string mimeType);
}
