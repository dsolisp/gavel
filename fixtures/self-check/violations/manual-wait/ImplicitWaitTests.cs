using System;
using NUnit.Framework;
using OpenQA.Selenium;

namespace Gavel.Fixtures;

public class ImplicitWaitTests
{
    [Test]
    public void ImplicitWaitIsManualWait(IWebDriver driver)
    {
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
        driver.FindElement(By.Id("result")).Click();
    }
}
