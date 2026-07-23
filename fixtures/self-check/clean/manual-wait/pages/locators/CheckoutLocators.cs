using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages.Locators;

public static class CheckoutLocators
{
    public static ILocator TotalHeading(IPage page) =>
        page.GetByRole(AriaRole.Heading);
}
