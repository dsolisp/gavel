using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class MultipleConstructTests
{
    [Test]
    public void First_ConstructsPageDirectly()
    {
        var loginPage = new LoginPage(null!);
        loginPage.Open();
    }

    [Test]
    public void Second_ConstructsPageDirectly()
    {
        var dashboardPage = new DashboardPage(null!);
        dashboardPage.Verify();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Open() { }
}

public class DashboardPage
{
    public DashboardPage(IPage page) { }
    public void Verify() { }
}
