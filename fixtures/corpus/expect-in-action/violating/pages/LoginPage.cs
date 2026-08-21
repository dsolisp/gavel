using static Microsoft.Playwright.Assertions;
using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages;

public class LoginPage
{
    private readonly IPage _page;
    public LoginPage(IPage page) => _page = page;

    public async Task LoginAsync()
    {
        await _page.ClickAsync("#login");
        await Expect(_page.Locator("body")).ToBeVisibleAsync();
    }
}
