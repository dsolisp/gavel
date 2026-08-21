using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class SetUpInjectionTests
{
    private IPage _page;
    private LoginPage _loginPage;

    [SetUp]
    public void Setup()
    {
        _loginPage = new LoginPage(_page);
    }

    [Test]
    public void Login_UsesSetUpPage()
    {
        _loginPage.Open();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Open() { }
}
