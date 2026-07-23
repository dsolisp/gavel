// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run `node scripts/self-check.js fixtures/sample-repos/playwright-dotnet` to see
// the findings. Do not copy this file into a real suite.

using System.Threading;
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;
using Sample.PlaywrightDotnet.Pages.Actions;
using Sample.PlaywrightDotnet.Pages.Locators;

namespace Sample.PlaywrightDotnet.Tests;

public class LoginBadTests : PageTest
{
    private readonly LoginActions _loginPage = new LoginActions(null!);
    private readonly LoginActionsBad _badLoginPage = new LoginActionsBad(null!);

    [Ignore]
    [Test]
    public async Task ShouldShowErrorOnBadCredentials()
    {
        await _loginPage.SignInAsync("wrong@example.test", "wrong");
    }

    [Test]
    public async Task ValidCredentialsRedirectToDashboard()
    {
        await Page.Locator("#email").FillAsync("user@example.test");
        await Page.Locator("#password").FillAsync("pw-1234");
        await Page.Locator("button[type=\"submit\"]").ClickAsync();
        await Page.WaitForTimeoutAsync(2000);
        await Expect(Page.Locator("h1")).ToBeVisibleAsync();
    }

    [Test]
    public async Task AlternateSignInPathExercisesBadAction()
    {
        await _badLoginPage.SignInAsync("user@example.test", "pw-1234");
    }

    [Test]
    public async Task LoginFormRejectsEmptyEmail()
    {
        await Page.GotoAsync("/login");
        await Page.Locator("button[type=\"submit\"]").ClickAsync();
        Thread.Sleep(500);
        await Expect(Page.Locator(".error")).ToBeVisibleAsync();
    }

    [Test]
    public async Task LoginFormRejectsEmptyPassword()
    {
        await Page.GotoAsync("/login");
        await Page.Locator("#email").FillAsync("user@example.test");
        await Page.Locator("button[type=\"submit\"]").ClickAsync();
        await Task.Delay(500);
        await Expect(Page.Locator(".error")).ToBeVisibleAsync();
    }

    [Test]
    public async Task RateLimitKicksInAfterManyAttempts()
    {
        for (var i = 0; i < 5; i += 1)
        {
            await Page.Locator("#email").FillAsync("user@example.test");
            await Page.Locator("#password").FillAsync($"wrong-{i}");
            await Page.Locator("button[type=\"submit\"]").ClickAsync();
            Thread.Sleep(100);
        }

        await Expect(Page.Locator(".rate-limit-error")).ToBeVisibleAsync();
    }

    [Test]
    public void PlaceholderForIgnoreNoReason()
    {
        Assert.That(1, Is.EqualTo(1));

        // gavel-ignore

        Assert.That(2, Is.EqualTo(2));
    }

    [Test]
    public async Task FullHappyPathJourneyExercisesEveryInput()
    {
        await Page.GotoAsync("/login");
        await Page.Locator("#email").FillAsync("user@example.test");
        await Page.Locator("#password").FillAsync("pw-1234");
        await Page.Locator("button[type=\"submit\"]").ClickAsync();
        await Expect(Page.Locator("h1")).ToHaveTextAsync("Dashboard");
    }

    [Test]
    public async Task FullErrorPathJourneyShowsErrorState()
    {
        await Page.GotoAsync("/login");
        await Page.Locator("#email").FillAsync("user@example.test");
        await Page.Locator("#password").FillAsync("wrong");
        await Page.Locator("button[type=\"submit\"]").ClickAsync();
        await Expect(Page.Locator(".error")).ToBeVisibleAsync();
    }
}
