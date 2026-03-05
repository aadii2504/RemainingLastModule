namespace MyProject.Api.DTOs;

public class CourseDto
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
    public decimal Price { get; set; } = 0;
    public int Students { get; set; } = 0;
    public string Status { get; set; } = "published";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CourseCreateRequestDto
{
    public string Title { get; set; } = null!;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string? Categories { get; set; }
    public string? Duration { get; set; }
    public string Level { get; set; } = "beginner";
    public decimal Price { get; set; } = 0;
    public string Status { get; set; } = "published";
}

public class CourseResponseDto
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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
