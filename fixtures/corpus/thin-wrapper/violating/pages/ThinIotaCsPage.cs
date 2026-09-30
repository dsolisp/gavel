namespace ThinWrapperCorpus.Pages;

public class ThinIotaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public ThinIotaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ClickIotaAsync() => await _locators.IotaButton.ClickAsync();
}
