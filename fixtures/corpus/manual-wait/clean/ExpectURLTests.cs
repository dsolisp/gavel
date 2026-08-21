using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ExpectURLTests
{
    [Test]
    public async Task Expect_URLAfterNavigation()
    {
        var page = await Task.FromResult<IPage>(null!);
        await page.GetByRole(AriaRole.Link, new() { Name = "About" }).ClickAsync();
        await Expect(page).ToHaveURLAsync("**/about");
    }

    [Test]
    public async Task Expect_TitleAfterLoad()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page).ToHaveTitleAsync("Dashboard - Gavel");
    }
}
