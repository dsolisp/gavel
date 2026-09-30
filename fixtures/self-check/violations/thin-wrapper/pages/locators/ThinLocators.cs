using Microsoft.Playwright;

namespace ThinWrapper.Pages.Locators;

public class ThinLocators
{
    private readonly IPage _page;

    public ThinLocators(IPage page) => _page = page;

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
}
