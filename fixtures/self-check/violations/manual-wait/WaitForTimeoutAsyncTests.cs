using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class WaitForTimeoutAsyncTests
{
    [Test]
    public async Task FixedPageTimeout(IPage page)
    {
        await page.WaitForTimeoutAsync(3000);
    }
}
