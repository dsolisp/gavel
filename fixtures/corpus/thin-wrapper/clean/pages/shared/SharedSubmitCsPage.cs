namespace ThinWrapperCorpus.Clean.Pages.Shared;

public class SharedSubmitCsPage
{
    private readonly Locators.CleanCorpusLocators _locators;

    public SharedSubmitCsPage(Locators.CleanCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task SharedSubmitCsAsync() => await _locators.SharedButton.ClickAsync();
}
