namespace ThinWrapperCorpus.Clean.Pages;

public class ComposedLoginCsPage
{
    private readonly Locators.CleanCorpusLocators _locators;

    public ComposedLoginCsPage(Locators.CleanCorpusLocators locators) => _locators = locators;

    public Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email, string password)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.PasswordField.FillAsync(password);
        await _locators.SubmitButton.ClickAsync();
    }
}
