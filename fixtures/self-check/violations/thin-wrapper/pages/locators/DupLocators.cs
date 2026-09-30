using Microsoft.Playwright;

namespace ThinWrapper.Pages.Locators;

public class DupLocators
{
    private readonly IPage _page;

    public DupLocators(IPage page) => _page = page;

    public ILocator OkButton => _page.GetByRole(AriaRole.Button, new() { Name = "OK" });
}
