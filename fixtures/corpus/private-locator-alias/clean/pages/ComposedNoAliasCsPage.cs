namespace PrivateAliasCorpus.Clean.Pages;

public class ComposedNoAliasCsPage
{
    private readonly Locators.DualCorpusLocators _locators;

    public ComposedNoAliasCsPage(Locators.DualCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task SignInAsync(string email)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.SubmitButton.ClickAsync();
    }
}
