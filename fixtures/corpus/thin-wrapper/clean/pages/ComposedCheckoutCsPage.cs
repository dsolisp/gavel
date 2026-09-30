namespace ThinWrapperCorpus.Clean.Pages;

public class ComposedCheckoutCsPage
{
    private readonly Locators.CleanCorpusLocators _locators;

    public ComposedCheckoutCsPage(Locators.CleanCorpusLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task CheckoutAsync(string card)
    {
        await _locators.CardField.FillAsync(card);
        await _locators.PayButton.ClickAsync();
    }
}
