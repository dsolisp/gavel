using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages.Locators;

public static class LoginLocators
{
    public static ILocator SubmitButton(IPage page) =>
        page.GetByRole(AriaRole.Button, new() { Name = "Save" });
}
