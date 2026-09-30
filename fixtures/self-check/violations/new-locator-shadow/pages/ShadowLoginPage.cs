namespace NewShadow.Pages;

public class BaseLoginPage
{
    public virtual Microsoft.Playwright.ILocator SubmitButton { get; }
}

public class ShadowLoginPage : BaseLoginPage
{
    private readonly Locators.ShadowLocators _locators;

    public ShadowLoginPage(Locators.ShadowLocators locators) => _locators = locators;

    // Shadows base locator with new — should fire new-locator-shadow.
    public new Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.SubmitButton.ClickAsync();
    }
}
