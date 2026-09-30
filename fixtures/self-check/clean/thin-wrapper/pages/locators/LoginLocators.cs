using Microsoft.Playwright;

namespace ThinWrapper.Pages.Locators;

public class LoginLocators
{
    private readonly IPage _page;

    public LoginLocators(IPage page) => _page = page;

    public ILocator EmailField => _page.GetByLabel("Email");

    public ILocator PasswordField => _page.GetByLabel("Password");

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
}
