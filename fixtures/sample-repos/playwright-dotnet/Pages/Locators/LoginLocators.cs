using Microsoft.Playwright;

namespace Sample.PlaywrightDotnet.Pages.Locators;

public class LoginLocators
{
    private readonly IPage _page;

    private LoginLocators(IPage page) => _page = page;

    public static LoginLocators For(IPage page) => new(page);

    public ILocator EmailInput => _page.GetByLabel("Email");

    public ILocator PasswordInput => _page.GetByLabel("Password");

    public ILocator SignInButton => _page.GetByRole(AriaRole.Button, new() { Name = "Sign in" });

    public ILocator DashboardHeading => _page.GetByRole(AriaRole.Heading, new() { Name = "Dashboard" });

    public ILocator ErrorMessage => _page.GetByText("Invalid credentials");
}
