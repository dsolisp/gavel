// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run `node scripts/self-check.js fixtures/sample-repos/appium-dotnet` to see
// the findings. Do not copy this file into a real suite.

using System;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium.Appium;
using Sample.AppiumDotnet.Pages.Actions;

namespace Sample.AppiumDotnet.Tests;

public class LoginBadTests
{
    private AppiumDriver _driver = null!;
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
        _driver.FindElement(AppiumBy.AccessibilityId("email-input")).SendKeys("user@example.test");
        _driver.FindElement(AppiumBy.AccessibilityId("password-input")).SendKeys("pw-1234");
        _driver.FindElement(AppiumBy.AccessibilityId("sign-in-button")).Click();
        Thread.Sleep(2000);
        Assert.That(_driver.FindElement(AppiumBy.AccessibilityId("dashboard-heading")).Displayed, Is.True);
    }

    [Test]
    public void AlternateSignInPathExercisesBadAction()
    {
        _badLoginPage.SignIn("user@example.test", "pw-1234");
    }

    [Test]
    public void LoginFormRejectsEmptyEmail()
    {
        _driver.FindElement(AppiumBy.AccessibilityId("sign-in-button")).Click();
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
