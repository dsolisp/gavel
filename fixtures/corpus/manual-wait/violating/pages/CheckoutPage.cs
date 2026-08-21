using System.Threading.Tasks;
using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages;

public class CheckoutPage
{
    private readonly IPage _page;

    public CheckoutPage(IPage page) => _page = page;

    public async Task SubmitOrderAsync()
    {
        await _page.GetByRole(AriaRole.Button, new() { Name = "Place order" }).ClickAsync();
        await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }
}
