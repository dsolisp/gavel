using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ParameterlessLoadStateTests
{
    [Test]
    public async Task LoadState_Parameterless()
    {
        var page = await Task.FromResult<IPage>(null!);
        await page.GotoAsync("https://example.com");
        await page.WaitForLoadStateAsync();
    }
}
