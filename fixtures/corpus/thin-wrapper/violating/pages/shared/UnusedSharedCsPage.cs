namespace ThinWrapperCorpus.Pages.Shared;

public class UnusedSharedCsPage
{
    private readonly Locators.ThinCorpusLocators _locators;

    public UnusedSharedCsPage(Locators.ThinCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task OrphanSubmitCsAsync() => await _locators.OrphanButton.ClickAsync();
}
