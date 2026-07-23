// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run `node scripts/self-check.js fixtures/sample-repos/selenium-dotnet` to see
// the findings. Do not copy this file into a real suite.

using System;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium;
using Sample.SeleniumDotnet.Pages.Actions;

namespace Sample.SeleniumDotnet.Tests;

public class LoginBadTests
{
    private IWebDriver _driver = null!;
    private readonly LoginActions _loginPage = new LoginActions(null!);
    private readonly LoginActionsBad _badLoginPage = new LoginActionsBad(null!);

    [Ignore]
    [Test]
    public void ShouldShowErrorOnBadCredentials()
    {
        _loginPage.SignIn("wrong@example.test", "wrong");
    }

    [Test]
    public void ValidCredentialsRevealDashboard()
    {
        _driver.FindElement(By.CssSelector("[data-test='email-input']")).SendKeys("user@example.test");
        _driver.FindElement(By.CssSelector("[data-test='password-input']")).SendKeys("pw-1234");
        _driver.FindElement(By.CssSelector("[data-test='sign-in-button']")).Click();
        Thread.Sleep(2000);
        Assert.That(_driver.FindElement(By.CssSelector("[data-test='dashboard-heading']")).Displayed, Is.True);
    }

    [Test]
    public void AlternateSignInPathExercisesBadAction()
    {
        _badLoginPage.SignIn("user@example.test", "pw-1234");
    }

    [Test]
    public void LoginFormRejectsEmptyEmail()
    {
        _driver.FindElement(By.CssSelector("[data-test='sign-in-button']")).Click();
        Task.Delay(500);
    }

    [Test]
    public void PlaceholderForIgnoreNoReason()
    {
        Assert.That(1, Is.EqualTo(1));

        // gavel-ignore

        Assert.That(2, Is.EqualTo(2));
    }
}
