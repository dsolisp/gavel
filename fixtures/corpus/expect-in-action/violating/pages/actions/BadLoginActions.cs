using NUnit.Framework;
using OpenQA.Selenium;

namespace Gavel.Fixtures.Pages.Actions;

public class BadLoginActions
{
    private readonly IWebDriver _driver;
    public BadLoginActions(IWebDriver driver) => _driver = driver;

    public void Submit()
    {
        Assert.AreEqual("Dashboard", _driver.Title);
    }
}
