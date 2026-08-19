public class AccessibleCsharpLocators
{
    public static ILocator SubmitButton(IPage page) =>
        page.GetByRole(AriaRole.Button, new() { NameString = "Submit" });

    public static ILocator SettingsIcon(AppiumDriver driver) =>
        driver.FindElement(AppiumBy.AccessibilityId("settings-icon"));
}
