public class AppiumA11yLocators
{
    public static AppiumElement SettingsIcon(AppiumDriver driver) =>
        driver.FindElement(AppiumBy.AccessibilityId("settings-icon"));
}
