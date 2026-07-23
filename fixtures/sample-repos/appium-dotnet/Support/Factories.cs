using System;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.Appium.Android;

namespace Sample.AppiumDotnet.Support;

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
    public static AndroidDriver CreateAndroidDriver()
    {
        var options = new AppiumOptions
        {
            AutomationName = "UiAutomator2",
            PlatformName = "Android",
        };
        var serverUri = new Uri(Environment.GetEnvironmentVariable("APPIUM_SERVER_URL") ?? "http://127.0.0.1:4723");
        return new AndroidDriver(serverUri, options);
    }
}
