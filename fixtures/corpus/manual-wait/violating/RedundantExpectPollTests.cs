using System.Threading;
using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class RedundantExpectPollTests
{
    [Test]
    public async Task RedundantSleepBeforeExpect(IPage page)
    {
        await page.GotoAsync("/example");
        Thread.Sleep(1000);
        await Expect(page.GetByRole(AriaRole.Button)).ToBeVisibleAsync();
    }
}
