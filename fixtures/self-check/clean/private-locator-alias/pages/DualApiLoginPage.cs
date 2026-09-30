namespace PrivateAlias.Pages;

public class DualApiLoginPage
{
    private readonly Locators.DualLocators _locators;

    public DualApiLoginPage(Locators.DualLocators locators) => _locators = locators;

    // Public dual-API re-export is intentional — not a private alias.
    public Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.SubmitButton.ClickAsync();
    }
}
