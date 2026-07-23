using Microsoft.Playwright;
using Sample.PlaywrightDotnet.Pages.Locators;

namespace Sample.PlaywrightDotnet.Pages.Actions;

// VIOLATION FILE: Expect in action class — specs own assertions; actions perform
// interactions only. Canonical pattern is LoginActions.cs (no Expect/Assert).
public class LoginActionsBad
{
    private readonly LoginLocators _locators;

    public LoginActionsBad(IPage page)
    {
        _locators = LoginLocators.For(page);
    }

    public async Task SignInAsync(string email, string password)
    {
        await _locators.EmailInput.FillAsync(email);
        await _locators.PasswordInput.FillAsync(password);
        // VIOLATION: assertion APIs belong in test files, not action classes.
        await Expect(_locators.EmailInput).ToBeEditableAsync();
        await _locators.SignInButton.ClickAsync();
    }
}
