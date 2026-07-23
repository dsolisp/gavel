using System;
using NUnit.Framework;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.Support.UI;
using Sample.AppiumDotnet.Pages.Actions;
using Sample.AppiumDotnet.Pages.Locators;
using Sample.AppiumDotnet.Support;

namespace Sample.AppiumDotnet.Tests;

public class LoginGoodTests
{
    private AppiumDriver _driver = null!;
    private LoginActions _actions = null!;
    private LoginLocators _locators = null!;

    [SetUp]
    public void SetUp()
    {
        _driver = DriverFactory.CreateAndroidDriver();
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
