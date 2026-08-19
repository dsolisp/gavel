using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class NetworkIdleTests
{
    [Test]
    public async Task WaitForNetworkIdle(IPage page)
    {
        await page.GotoAsync("/example");
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }
}
