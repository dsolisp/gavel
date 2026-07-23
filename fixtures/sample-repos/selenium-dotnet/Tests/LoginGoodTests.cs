using System;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using Sample.SeleniumDotnet.Pages.Actions;
using Sample.SeleniumDotnet.Pages.Locators;
using Sample.SeleniumDotnet.Support;

namespace Sample.SeleniumDotnet.Tests;

public class LoginGoodTests
{
    private IWebDriver _driver = null!;
    private LoginActions _actions = null!;
    private LoginLocators _locators = null!;

    [SetUp]
    public void SetUp()
    {
        _driver = DriverFactory.CreateChromeDriver();
        _driver.Navigate().GoToUrl(DriverFactory.BaseUrl);
        _actions = LoginActions.For(_driver);
        _locators = LoginLocators.For(_driver);
    }

    [TearDown]
    public void TearDown() => _driver.Quit();

    [Test]
    [Category("smoke")]
    public void ValidCredentialsRevealDashboard()
    {
        var user = UserFactory.Create(UserRole.Trader);
        _actions.SignIn(user.Email, user.Password);

        var wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
        var heading = wait.Until(_ => _locators.DashboardHeading);
        Assert.That(heading.Displayed, Is.True);
    }

    [Test]
    [Category("regression")]
    public void InvalidCredentialsShowError()
    {
        _actions.SignIn("wrong@example.test", "wrongpass");

        var wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
        var error = wait.Until(_ => _locators.ErrorMessage);
        Assert.That(error.Displayed, Is.True);
    }
}
