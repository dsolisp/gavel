using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class LoginTestBase
{
    protected IPage Page;

    [SetUp]
    public void Setup()
    {
        Page = new LoginPage(null!);
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
}
