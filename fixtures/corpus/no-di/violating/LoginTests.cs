using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class LoginTests
{
    [Test]
    public void Login_ConstructsPageDirectly()
    {
        // Direct construction — test-only no-di hit for C# surface coverage
        var loginPage = new LoginPage(null!);
        loginPage.Open();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Open() { }
}
