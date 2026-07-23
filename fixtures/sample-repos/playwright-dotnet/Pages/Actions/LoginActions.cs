using Microsoft.Playwright;
using Sample.PlaywrightDotnet.Pages.Locators;

namespace Sample.PlaywrightDotnet.Pages.Actions;

public class LoginActions
{
    private readonly IPage _page;
    private readonly LoginLocators _locators;

    public LoginActions(IPage page)
    {
        _page = page;
        _locators = LoginLocators.For(page);
    }

    public static LoginActions For(IPage page) => new(page);

    public async Task NavigateToAsync(string path)
    {
        await _page.GotoAsync(path, new() { WaitUntil = WaitUntilState.DOMContentLoaded });
    }

    public async Task SignInAsync(string email, string password)
    {
        await _locators.EmailInput.FillAsync(email);
        await _locators.PasswordInput.FillAsync(password);
        await _locators.SignInButton.ClickAsync();
    }
}
