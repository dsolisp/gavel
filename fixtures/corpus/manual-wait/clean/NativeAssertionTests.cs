using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class NativeAssertionTests
{
    [Test]
    public async Task Comment_Thread_Sleep_DoesNotFire()
    {
        // We used to Thread.Sleep(1000) here but now use Expect.
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.Locator("#result")).ToBeVisibleAsync();
    }

    [Test]
    public async Task CountAssertion()
    {
        var page = await Task.FromResult<IPage>(null!);
        await Expect(page.GetByRole(AriaRole.Listitem)).ToHaveCountAsync(3);
    }
}
