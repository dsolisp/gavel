namespace Sample.PlaywrightDotnet.Support;

public enum UserRole
{
    Trader,
    Admin,
    Viewer,
}

public record User(string Email, string Password, UserRole Role);

public static class UserFactory
{
    public static User Create(UserRole role = UserRole.Trader)
    {
        var stamp = DateTime.UtcNow.Ticks.ToString("x");
        return new User($"user-{stamp}@example.test", $"pw-{stamp}", role);
    }
}
