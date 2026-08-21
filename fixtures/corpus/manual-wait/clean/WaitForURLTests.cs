using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class WaitForURLTests
{
    [Test]
    public async Task Login_WaitsForURL()
    {
        var page = await Task.FromResult<IPage>(null!);
        await page.GetByRole(AriaRole.Button, new() { Name = "Sign in" }).ClickAsync();
        await page.WaitForURLAsync("**/dashboard");
    }
}
