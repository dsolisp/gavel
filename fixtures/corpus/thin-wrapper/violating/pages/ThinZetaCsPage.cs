namespace ThinWrapperCorpus.Pages;

public class ThinZetaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public ThinZetaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ClickZetaAsync() => await _locators.ZetaButton.ClickAsync();
}
