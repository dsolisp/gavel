using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ExpectVisibleTests
{
    [Test]
    public async Task Expect_ToBeVisible()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.GetByRole(AriaRole.Heading)).ToBeVisibleAsync();
    }

    [Test]
    public async Task Expect_ToHaveText()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.GetByTestId("status")).ToHaveTextAsync("Ready");
    }
}
