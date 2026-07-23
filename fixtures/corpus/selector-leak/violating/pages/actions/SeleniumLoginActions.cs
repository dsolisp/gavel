using OpenQA.Selenium;

namespace Gavel.Fixtures.Pages.Actions;

public class SeleniumLoginActions
{
    private readonly IWebDriver _driver;
    public SeleniumLoginActions(IWebDriver driver) => _driver = driver;

    public void ClickSubmit()
    {
        _driver.FindElement(By.CssSelector("[data-testid='submit']")).Click();
    }
}
