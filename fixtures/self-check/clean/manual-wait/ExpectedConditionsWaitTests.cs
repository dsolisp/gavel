using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ExpectedConditionsWaitTests
{
    [Test]
    public void WaitUntilElementVisible(IWebDriver driver)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
        wait.Until(ExpectedConditions.ElementIsVisible(By.Id("result")));
    }
}
