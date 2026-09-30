namespace PrivateAlias.Pages;

public class AliasedLoginPage
{
    private readonly Locators.AliasLocators _locators;

    public AliasedLoginPage(Locators.AliasLocators locators) => _locators = locators;

    // 1:1 private alias of locator layer — should fire private-locator-alias.
    private Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await SubmitButton.ClickAsync();
    }
}
