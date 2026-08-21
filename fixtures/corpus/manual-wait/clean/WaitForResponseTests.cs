using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class WaitForResponseTests
{
    [Test]
    public async Task Api_WaitsForSpecificResponse()
    {
        var page = await Task.FromResult<IPage>(null!);
        var response = await page.WaitForResponseAsync("**/api/data");
        Assert.That(response.Status, Is.EqualTo(200));
    }
}
