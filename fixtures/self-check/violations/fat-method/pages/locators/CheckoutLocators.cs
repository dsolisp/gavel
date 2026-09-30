using Microsoft.Playwright;

namespace FatMethod.Pages.Locators;

public class CheckoutLocators
{
    private readonly IPage _page;

    public CheckoutLocators(IPage page) => _page = page;

    public ILocator EmailField => _page.GetByLabel("Email");

    public ILocator CardField => _page.GetByLabel("Card");

    public ILocator AddressField => _page.GetByLabel("Address");

    public ILocator CityField => _page.GetByLabel("City");

    public ILocator ZipField => _page.GetByLabel("Zip");

    public ILocator TermsCheckbox => _page.GetByLabel("Terms");

    public ILocator NewsletterCheckbox => _page.GetByLabel("Newsletter");

    public ILocator ContinueButton => _page.GetByRole(AriaRole.Button, new() { Name = "Continue" });

    public ILocator PlaceOrderButton => _page.GetByRole(AriaRole.Button, new() { Name = "Place order" });
}
