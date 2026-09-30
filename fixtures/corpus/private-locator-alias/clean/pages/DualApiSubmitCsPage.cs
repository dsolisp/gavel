namespace PrivateAliasCorpus.Clean.Pages;

public class DualApiSubmitCsPage
{
    private readonly Locators.DualCorpusLocators _locators;

    public DualApiSubmitCsPage(Locators.DualCorpusLocators locators) => _locators = locators;

    public Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.SubmitButton.ClickAsync();
    }
}
