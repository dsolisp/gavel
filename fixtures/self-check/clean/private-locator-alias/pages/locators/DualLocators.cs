using Microsoft.Playwright;

namespace PrivateAlias.Pages.Locators;

public class DualLocators
{
    private readonly IPage _page;

    public DualLocators(IPage page) => _page = page;

    public ILocator EmailField => _page.GetByLabel("Email");

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
}
