using NUnit.Framework;
using OpenQA.Selenium;
using Sample.SeleniumDotnet.Pages.Locators;

namespace Sample.SeleniumDotnet.Pages.Actions;

// VIOLATION FILE: assertions belong in specs, not action classes. The canonical
// pattern is LoginActions.cs (no Assert). Do not copy this into a real suite.
public class LoginActionsBad
{
    private readonly LoginLocators _locators;

    public LoginActionsBad(IWebDriver driver)
    {
        _locators = LoginLocators.For(driver);
    }

    public void SignIn(string email, string password)
    {
        _locators.EmailInput.SendKeys(email);
        _locators.PasswordInput.SendKeys(password);
        // VIOLATION: expect-in-action — assertion APIs belong in test files.
        Assert.That(_locators.SignInButton.Enabled, Is.True);
        _locators.SignInButton.Click();
    }
}
