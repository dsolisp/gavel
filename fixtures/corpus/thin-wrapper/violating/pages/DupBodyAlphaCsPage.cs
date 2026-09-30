namespace ThinWrapperCorpus.Pages;

public class DupBodyAlphaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public DupBodyAlphaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ConfirmDupCsAsync() => await _locators.OkButton.ClickAsync();
}
