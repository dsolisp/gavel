using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

// Gate 2 fixture: a normal *Tests.cs file (Gate 1 does not skip) with
// new LoginPage(page) only inside [SetUp]. The [Test] method uses the field.
// Must NOT fire no-di — SetUp is fixture DI, not spec-body construction.
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
