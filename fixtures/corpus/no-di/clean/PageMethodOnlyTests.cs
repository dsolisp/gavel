using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class PageMethodOnlyTests
{
    private IPage _page;

    [Test]
    public void Navigate_Home()
    {
        _page.GotoAsync("https://example.com");
    }

    [Test]
    public void Navigate_About()
    {
        _page.GotoAsync("https://example.com/about");
    }
}
