using System.Threading.Tasks;
using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages;

public class LoginPage
{
    private readonly IPage _page;

    public LoginPage(IPage page) => _page = page;

    public async Task LoginAsync(string user, string pass)
    {
        await _page.GetByRole(AriaRole.Button, new() { Name = "Sign in" }).ClickAsync();
        // lesson #12: NetworkIdle after click instead of Expect
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }
}
