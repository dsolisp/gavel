using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class NetworkIdleRedundantTests
{
    [Test]
    public async Task RedundantNetworkIdleBeforeExpect(IPage page)
    {
        await page.GotoAsync("/example");
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        await Expect(page.GetByRole(AriaRole.Button)).ToBeVisibleAsync();
    }
}
