using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ComposedFixtureTests
{
    private IPage _page;
    private LoginPage _loginPage;
    private DashboardPage _dashboardPage;

    [SetUp]
    public void Setup()
    {
        _loginPage = new LoginPage(_page);
        _dashboardPage = new DashboardPage(_page);
    }

    [Test]
    public void LoginThenDashboard_UsesComposedFixtures()
    {
        _loginPage.Open();
        _dashboardPage.LoadMetrics();
    }
}
