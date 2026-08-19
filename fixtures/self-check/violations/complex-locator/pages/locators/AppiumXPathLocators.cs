public class AppiumXPathLocators
{
    public static IAppiumWebElement SubmitButton(AppiumDriver driver) =>
        driver.FindElement(AppiumBy.XPath("//android.widget.Button[@text='Submit']"));
}
