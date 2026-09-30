using Microsoft.Playwright;

namespace NewShadow.Pages.Locators;

public class ShadowLocators
{
    private readonly IPage _page;

    public ShadowLocators(IPage page) => _page = page;

    public ILocator EmailField => _page.GetByLabel("Email");

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
}
