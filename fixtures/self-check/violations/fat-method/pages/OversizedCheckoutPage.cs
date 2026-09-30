namespace FatMethod.Pages;

public class OversizedCheckoutPage
{
    private readonly Locators.CheckoutLocators _locators;

    public OversizedCheckoutPage(Locators.CheckoutLocators locators) => _locators = locators;

    // Intentionally long multi-action method for fat-method detection.
    public async System.Threading.Tasks.Task CompleteCheckoutAsync(
        string email,
        string card,
        string address,
        string city,
        string zip)
    {
        await _locators.EmailField.FillAsync(email);
        await _locators.CardField.FillAsync(card);
        await _locators.AddressField.FillAsync(address);
        await _locators.CityField.FillAsync(city);
        await _locators.ZipField.FillAsync(zip);
        await _locators.TermsCheckbox.CheckAsync();
        await _locators.NewsletterCheckbox.CheckAsync();
        await _locators.ContinueButton.ClickAsync();
        // Padding lines so non-blank body reaches the fat-method threshold.
        var step = "review";
        step = "confirm";
        step = "place";
        step = "done";
        step = "a";
        step = "b";
        step = "c";
        step = "d";
        step = "e";
        step = "f";
        step = "g";
        step = "h";
        step = "i";
        step = "j";
        step = "k";
        step = "l";
        step = "m";
        step = "n";
        await _locators.PlaceOrderButton.ClickAsync();
        _ = step;
    }
}
