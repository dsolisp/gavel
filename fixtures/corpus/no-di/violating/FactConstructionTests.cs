using Microsoft.Playwright;
using Xunit;

namespace Gavel.Fixtures;

public class FactConstructionTests
{
    [Fact]
    public void Login_ConstructsPageDirectly()
    {
        var loginPage = new LoginPage(null!);
        loginPage.Open();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Open() { }
}
