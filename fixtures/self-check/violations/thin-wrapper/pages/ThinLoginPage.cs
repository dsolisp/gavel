using Microsoft.Playwright;

namespace ThinWrapper.Pages;

public class ThinLoginPage
{
    private readonly ILocator _submit;

    public ThinLoginPage(IPage page)
    {
        _submit = page.GetByRole(AriaRole.Button, new() { Name = "Submit" });
    }

    // Thin wrapper: single native interaction — should fire thin-wrapper.
    public async Task SubmitAsync() => await _submit.ClickAsync();
}
