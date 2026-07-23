using OpenQA.Selenium;
using Sample.SeleniumDotnet.Pages.Locators;

namespace Sample.SeleniumDotnet.Pages.Actions;

public class LoginActions
{
    private readonly LoginLocators _locators;

    public LoginActions(IWebDriver driver)
    {
        _locators = LoginLocators.For(driver);
    }

    public static LoginActions For(IWebDriver driver) => new(driver);

    public void SignIn(string email, string password)
    {
        _locators.EmailInput.SendKeys(email);
        _locators.PasswordInput.SendKeys(password);
        _locators.SignInButton.Click();
    }
}
