namespace FatMethod.Pages;

public class LeanCheckoutPage
{
    private readonly Locators.LeanCheckoutLocators _locators;

    public LeanCheckoutPage(Locators.LeanCheckoutLocators locators) => _locators = locators;

    public async System.Threading.Tasks.Task PayAsync(string card)
    {
        await _locators.CardField.FillAsync(card);
        await _locators.PayButton.ClickAsync();
    }
}
