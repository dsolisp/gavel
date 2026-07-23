using OpenQA.Selenium;
using OpenQA.Selenium.Appium;

namespace Gavel.Fixtures.Pages.Locators;

public sealed class AppiumLoginLocators
{
    private readonly AppiumDriver _driver;
    public AppiumLoginLocators(AppiumDriver driver) => _driver = driver;
    public IWebElement SubmitButton => _driver.FindElement(AppiumBy.AccessibilityId("submit-button"));
}
