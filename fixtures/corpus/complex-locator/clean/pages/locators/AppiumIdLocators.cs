public class AppiumIdLocators
{
    public static AppiumElement LoginButton(AppiumDriver driver) =>
        driver.FindElement(AppiumBy.Id("btn-login"));
}
