using OpenQA.Selenium;
using OpenQA.Selenium.Appium;

namespace Gavel.Fixtures.Pages.Actions;

public class AppiumLoginActions
{
    private readonly AppiumDriver _driver;
    public AppiumLoginActions(AppiumDriver driver) => _driver = driver;

    public void TapSubmit()
    {
        _driver.FindElement(AppiumBy.AccessibilityId("submit-button")).Click();
    }
}
