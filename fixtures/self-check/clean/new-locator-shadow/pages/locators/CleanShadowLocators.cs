using Microsoft.Playwright;

namespace NewShadow.Pages.Locators;

public class CleanShadowLocators
{
    private readonly IPage _page;

    public CleanShadowLocators(IPage page) => _page = page;

    public ILocator EmailField => _page.GetByLabel("Email");

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
}
