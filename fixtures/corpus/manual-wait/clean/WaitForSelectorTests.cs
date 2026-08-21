using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class WaitForSelectorTests
{
    [Test]
    public async Task WaitForDetached()
    {
        var page = await Task.FromResult<IPage>(null!);
        var spinner = page.GetByRole(AriaRole.Status);
        await spinner.WaitForAsync(new() { State = WaitForSelectorState.Detached });
    }

    [Test]
    public async Task WaitForHidden()
    {
        var page = await Task.FromResult<IPage>(null!);
        var modal = page.GetByRole(AriaRole.Dialog);
        await modal.WaitForAsync(new() { State = WaitForSelectorState.Hidden });
    }
}
