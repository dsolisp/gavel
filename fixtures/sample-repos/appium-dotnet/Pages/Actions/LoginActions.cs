using OpenQA.Selenium.Appium;
using Sample.AppiumDotnet.Pages.Locators;

namespace Sample.AppiumDotnet.Pages.Actions;

public class LoginActions
{
    private readonly LoginLocators _locators;

    public LoginActions(AppiumDriver driver)
    {
        _locators = LoginLocators.For(driver);
    }

    public static LoginActions For(AppiumDriver driver) => new(driver);

    public void SignIn(string email, string password)
    {
        _locators.EmailInput.SendKeys(email);
        _locators.PasswordInput.SendKeys(password);
        _locators.SignInButton.Click();
    }
}
