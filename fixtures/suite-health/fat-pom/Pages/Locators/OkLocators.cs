using Microsoft.Playwright;

namespace FatPom.Pages.Locators;

// Proper locator file — inside Locators/ dir. Not fat POM, not a leak.
public class OkLocators
{
    private readonly IPage _page;

    public OkLocators(IPage page) => _page = page;

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });

    public ILocator EmailField => _page.GetByLabel("Email");
}
