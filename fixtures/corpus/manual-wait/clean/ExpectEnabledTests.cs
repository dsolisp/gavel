using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ExpectEnabledTests
{
    [Test]
    public async Task Expect_ToBeEnabled()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.GetByRole(AriaRole.Button, new() { Name = "Submit" })).ToBeEnabledAsync();
    }

    [Test]
    public async Task Expect_ToBeChecked()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.GetByRole(AriaRole.Checkbox)).ToBeCheckedAsync();
    }
}
