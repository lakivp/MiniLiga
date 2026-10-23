namespace bek.DTOs;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public AdminDto Admin { get; set; } = null!;
}

public class AdminDto
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
}