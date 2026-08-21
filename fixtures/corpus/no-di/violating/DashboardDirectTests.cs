using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class DashboardDirectTests
{
    [Test]
    public void Dashboard_ConstructsPageDirectly()
    {
        var dashboardPage = new DashboardPage(null!);
        dashboardPage.VerifyMetrics();
    }
}

public class DashboardPage
{
    public DashboardPage(IPage page) { }
    public void VerifyMetrics() { }
}
