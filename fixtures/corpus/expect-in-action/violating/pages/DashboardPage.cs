using NUnit.Framework;

namespace Gavel.Fixtures.Pages;

public class DashboardPage
{
    private readonly IPage _page;
    public DashboardPage(IPage page) => _page = page;

    public void VerifyTitle()
    {
        Assert.AreEqual("Dashboard", _page.TitleAsync().Result);
    }
}
