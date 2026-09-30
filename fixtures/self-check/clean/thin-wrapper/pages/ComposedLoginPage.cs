namespace ThinWrapper.Pages;

public class ComposedLoginPage
{
    private readonly Locators.LoginLocators _locators;

    public ComposedLoginPage(Locators.LoginLocators locators) => _locators = locators;

    // Dual API: public named locator for the spec (not a thin wrapper).
    public Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    // Composed flow: multiple native interactions — not thin-wrapper.
    public async System.Threading.Tasks.Task SignInAsync(string email, string password)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.PasswordField.FillAsync(password);
        await _locators.SubmitButton.ClickAsync();
    }
}
