using Microsoft.Playwright;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Gavel.Fixtures;

[TestClass]
public class MstestTestInitializeTests
{
    private IPage _page;
    private LoginPage _loginPage;

    [TestInitialize]
    public void Initialize()
    {
        _loginPage = new LoginPage(_page);
    }

    [TestMethod]
    public void Login_UsesInitializePage()
    {
        _loginPage.Open();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Open() { }
}
