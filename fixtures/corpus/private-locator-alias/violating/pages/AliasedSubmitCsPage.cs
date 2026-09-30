namespace PrivateAliasCorpus.Pages;

public class AliasedSubmitCsPage
{
    private readonly Locators.AliasCorpusLocators _locators;

    public AliasedSubmitCsPage(Locators.AliasCorpusLocators locators) => _locators = locators;

    private Microsoft.Playwright.ILocator SubmitButton => _locators.SubmitButton;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await SubmitButton.ClickAsync();
    }
}
