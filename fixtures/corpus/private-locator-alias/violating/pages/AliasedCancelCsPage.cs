namespace PrivateAliasCorpus.Pages;

public class AliasedCancelCsPage
{
    private readonly Locators.AliasCorpusLocators _locators;

    public AliasedCancelCsPage(Locators.AliasCorpusLocators locators) => _locators = locators;

    private Microsoft.Playwright.ILocator CancelButton => _locators.CancelButton;

    public async System.Threading.Tasks.Task DismissAsync()
    {
        await CancelButton.ClickAsync();
    }
}
