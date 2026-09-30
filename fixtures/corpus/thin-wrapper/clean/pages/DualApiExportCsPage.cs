namespace ThinWrapperCorpus.Clean.Pages;

public class DualApiExportCsPage
{
    private readonly Locators.CleanCorpusLocators _locators;

    public DualApiExportCsPage(Locators.CleanCorpusLocators locators) => _locators = locators;

    public Microsoft.Playwright.ILocator PayButton => _locators.PayButton;

    public async System.Threading.Tasks.Task PrepareAndPayAsync(string card)
    {
        await _locators.CardField.FillAsync(card);
        await _locators.PayButton.ClickAsync();
    }
}
