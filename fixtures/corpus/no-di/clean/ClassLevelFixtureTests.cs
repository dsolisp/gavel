using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ClassLevelFixtureTests
{
    private IPage _page;
    private DashboardPage _dashboardPage;

    [SetUp]
    public void Setup()
    {
        _dashboardPage = new DashboardPage(_page);
    }

    [Test]
    public void Dashboard_UsesFixture()
    {
        _dashboardPage.LoadMetrics();
    }

    [Test]
    public void Dashboard_ChecksWidget()
    {
        _dashboardPage.VerifyWidget();
    }
}

public class DashboardPage
{
    public DashboardPage(IPage page) { }
    public void LoadMetrics() { }
    public void VerifyWidget() { }
}
