using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class PageGotoTests
{
    [Test]
    public async Task Navigate_DirectToPage()
    {
        var page = await Task.FromResult<IPage>(null!);
        await page.GotoAsync("https://example.com/dashboard");
        await Expect(page).ToHaveURLAsync("**/dashboard");
    }
}
