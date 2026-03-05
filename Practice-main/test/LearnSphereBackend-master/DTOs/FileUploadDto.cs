namespace MyProject.Api.DTOs;

public class FileUploadResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
}

public class ContentUploadRequestDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Order { get; set; } = 0;
}
