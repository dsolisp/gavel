namespace ThinWrapperCorpus.Pages;

public class ThinEtaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public ThinEtaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ClickEtaAsync() => await _locators.EtaButton.ClickAsync();
}
