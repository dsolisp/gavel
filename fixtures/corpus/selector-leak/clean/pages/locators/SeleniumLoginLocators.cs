using OpenQA.Selenium;

namespace Gavel.Fixtures.Pages.Locators;

public sealed class SeleniumLoginLocators
{
    private readonly IWebDriver _driver;
    public SeleniumLoginLocators(IWebDriver driver) => _driver = driver;
    public IWebElement SubmitButton => _driver.FindElement(By.CssSelector("[data-testid='submit']"));
}
