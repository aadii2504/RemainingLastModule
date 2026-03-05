namespace MyProject.Api.DTOs;

public class ChapterDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Order { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ChapterCreateRequestDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Order { get; set; } = 0;
}

public class ChapterUpdateRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Order { get; set; }
}

public class LessonDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Duration { get; set; }
    public int Order { get; set; }
    public List<CourseContentDto> Contents { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class LessonCreateRequestDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Duration { get; set; }
    public int Order { get; set; } = 0;
}

public class LessonUpdateRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Duration { get; set; }
    public int? Order { get; set; }
}

public class CourseContentDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string ContentType { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CourseContentCreateRequestDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Order { get; set; } = 0;
}

public class CourseWithStructureDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string? Categories { get; set; }
    public string? Duration { get; set; }
    public string Level { get; set; } = "beginner";
    public decimal Price { get; set; }
    public int Students { get; set; }
    public string Status { get; set; } = "published";
    public List<ChapterDto> Chapters { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
