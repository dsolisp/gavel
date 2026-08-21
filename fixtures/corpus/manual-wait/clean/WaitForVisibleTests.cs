using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class WaitForVisibleTests
{
    [Test]
    public async Task Dashboard_WaitsForElementVisible()
    {
        var page = await Task.FromResult<IPage>(null!);
        var heading = page.GetByRole(AriaRole.Heading);
        await heading.WaitForAsync(new() { State = WaitForSelectorState.Visible });
    }
}
