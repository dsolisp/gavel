using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class TestCaseConstructionTests
{
    [TestCase("admin")]
    [TestCase("user")]
    public void LoginWithRole(string role)
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
