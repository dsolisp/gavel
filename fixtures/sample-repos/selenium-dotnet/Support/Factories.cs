using System;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace Sample.SeleniumDotnet.Support;

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

public static class DriverFactory
{
    public static IWebDriver CreateChromeDriver()
    {
        var options = new ChromeOptions();
        options.AddArgument("--headless=new");
        return new ChromeDriver(options);
    }

    public static string BaseUrl =>
        Environment.GetEnvironmentVariable("SELENIUM_BASE_URL") ?? "http://127.0.0.1:5173";
}
