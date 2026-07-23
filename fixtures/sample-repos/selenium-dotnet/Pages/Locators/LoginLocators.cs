using OpenQA.Selenium;

namespace Sample.SeleniumDotnet.Pages.Locators;

public class LoginLocators
{
    private readonly IWebDriver _driver;

    private LoginLocators(IWebDriver driver) => _driver = driver;

    public static LoginLocators For(IWebDriver driver) => new(driver);

    public IWebElement EmailInput => _driver.FindElement(By.CssSelector("[data-test='email-input']"));

    public IWebElement PasswordInput => _driver.FindElement(By.CssSelector("[data-test='password-input']"));

    public IWebElement SignInButton => _driver.FindElement(By.CssSelector("[data-test='sign-in-button']"));

    public IWebElement DashboardHeading => _driver.FindElement(By.CssSelector("[data-test='dashboard-heading']"));

    public IWebElement ErrorMessage => _driver.FindElement(By.CssSelector("[data-test='error-message']"));
}
