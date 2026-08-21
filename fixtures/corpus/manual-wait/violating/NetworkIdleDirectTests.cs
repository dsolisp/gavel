using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class NetworkIdleDirectTests
{
    [Test]
    public async Task Navigate_WaitForNetworkIdle()
    {
        var page = await Task.FromResult<IPage>(null!);
        await page.GotoAsync("https://example.com");
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }
}
