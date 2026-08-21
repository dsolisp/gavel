using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

// Gate 1: *TestsBase.cs basename — infrastructure file skipped by no-di.
public class LoginTestsBase
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
