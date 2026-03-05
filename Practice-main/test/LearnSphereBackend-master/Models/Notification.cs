public class Notification
{
    public int Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? CourseId { get; set; }
    public string? Type { get; set; } // <--- ensure exists
}