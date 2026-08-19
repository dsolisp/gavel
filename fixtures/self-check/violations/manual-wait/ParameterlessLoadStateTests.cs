using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ParameterlessLoadStateTests
{
    [Test]
    public async Task ParameterlessLoadState(IPage page)
    {
        await page.GotoAsync("/example");
        await page.WaitForLoadStateAsync();
    }
}
