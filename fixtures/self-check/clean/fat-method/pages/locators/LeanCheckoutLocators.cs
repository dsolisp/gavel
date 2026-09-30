using Microsoft.Playwright;

namespace FatMethod.Pages.Locators;

public class LeanCheckoutLocators
{
    private readonly IPage _page;

    public LeanCheckoutLocators(IPage page) => _page = page;

    public ILocator CardField => _page.GetByLabel("Card");

    public ILocator PayButton => _page.GetByRole(AriaRole.Button, new() { Name = "Pay" });
}
