namespace ThinWrapperCorpus.Pages;

public class DupBodyBetaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public DupBodyBetaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ConfirmDupCsAltAsync() => await _locators.OkButton.ClickAsync();
}
