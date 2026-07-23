using System.Threading.Tasks;
using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace Gavel.Fixtures;

public class FixtureInjectionTests : PageTest
{
    [Test]
    public async Task UsesInjectedPage()
    {
        // Page arrives via PageTest fixture DI — no direct page object construction.
        await Page.GotoAsync("/dashboard");
    }
}
