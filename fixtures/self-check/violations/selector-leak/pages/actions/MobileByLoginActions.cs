using OpenQA.Selenium.Appium;

namespace Gavel.Fixtures.Pages.Actions;

// VIOLATION: MobileBy is deprecated — should use AppiumBy.*
public class MobileByLoginActions
{
    public void TapSubmit(AppiumDriver driver)
    {
        driver.FindElement(MobileBy.AndroidUIAutomator("new UiSelector().resourceId(\"submit\")")).Click();
    }
}
