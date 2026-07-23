using System.Threading;
using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class StaleReadEvaluateTests
{
    [Test]
    public async Task SleepBeforeEvaluate(IPage page)
    {
        Thread.Sleep(1000);
        await page.EvaluateAsync("() => document.title");
    }
}
