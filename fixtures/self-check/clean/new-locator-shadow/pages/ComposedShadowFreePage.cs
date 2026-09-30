namespace NewShadow.Pages;

public class ComposedShadowFreePage
{
    private readonly Locators.CleanShadowLocators _locators;

    public ComposedShadowFreePage(Locators.CleanShadowLocators locators) => _locators = locators;

    public Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.SubmitButton.ClickAsync();
    }
}
