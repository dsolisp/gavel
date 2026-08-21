using Microsoft.Playwright;
using Xunit;

namespace Gavel.Fixtures;

// xUnit [Fact] with direct page object construction inside the fact body.
// Must fire no-di — this is a real spec-body violation, not fixture DI.
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
