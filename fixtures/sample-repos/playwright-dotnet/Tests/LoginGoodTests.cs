using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;
using Sample.PlaywrightDotnet.Pages.Actions;
using Sample.PlaywrightDotnet.Pages.Locators;
using Sample.PlaywrightDotnet.Support;

namespace Sample.PlaywrightDotnet.Tests;

public class LoginGoodTests : PageTest
{
    [Test]
    [Category("smoke")]
    public async Task ValidCredentialsRedirectToDashboard()
    {
        var user = UserFactory.Create(UserRole.Trader);
        var actions = LoginActions.For(Page);
        var locators = LoginLocators.For(Page);

        await actions.NavigateToAsync("/login");
        await actions.SignInAsync(user.Email, user.Password);
        await Expect(locators.DashboardHeading).ToBeVisibleAsync();
    }

    [Test]
    [Category("regression")]
    public async Task InvalidCredentialsShowError()
    {
        var actions = LoginActions.For(Page);
        var locators = LoginLocators.For(Page);

        await actions.NavigateToAsync("/login");
        await actions.SignInAsync("wrong@example.test", "wrongpass");
        await Expect(locators.ErrorMessage).ToBeVisibleAsync();
    }
}
