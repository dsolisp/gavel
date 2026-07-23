using OpenQA.Selenium;
using OpenQA.Selenium.Appium;

namespace Sample.AppiumDotnet.Pages.Locators;

public class LoginLocators
{
    private readonly AppiumDriver _driver;

    private LoginLocators(AppiumDriver driver) => _driver = driver;

    public static LoginLocators For(AppiumDriver driver) => new(driver);

    public IWebElement EmailInput => _driver.FindElement(AppiumBy.AccessibilityId("email-input"));

    public IWebElement PasswordInput => _driver.FindElement(AppiumBy.AccessibilityId("password-input"));

    public IWebElement SignInButton => _driver.FindElement(AppiumBy.AccessibilityId("sign-in-button"));

    public IWebElement DashboardHeading => _driver.FindElement(AppiumBy.AccessibilityId("dashboard-heading"));

    public IWebElement ErrorMessage => _driver.FindElement(AppiumBy.AccessibilityId("error-message"));
}
