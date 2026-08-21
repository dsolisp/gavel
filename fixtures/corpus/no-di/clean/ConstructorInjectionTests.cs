using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ConstructorInjectionTests
{
    private readonly LoginPage _loginPage;

    public ConstructorInjectionTests(LoginPage loginPage)
    {
        _loginPage = loginPage;
    }

    [Test]
    public void Login_ViaConstructorInjection()
    {
        _loginPage.Open();
    }
}
