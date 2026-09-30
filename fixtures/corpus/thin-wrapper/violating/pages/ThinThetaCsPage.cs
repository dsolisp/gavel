namespace ThinWrapperCorpus.Pages;

public class ThinThetaCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public ThinThetaCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task ClickThetaAsync() => await _locators.ThetaButton.ClickAsync();
}
