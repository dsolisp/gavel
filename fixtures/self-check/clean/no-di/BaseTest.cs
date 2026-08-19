using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

// Infrastructure base class — Gate 1 skips no-di for BaseTest.cs.
// [SetUp] constructs a page object, which is NUnit fixture DI, not a spec-body violation.
public class BaseTest
{
    protected IPage Page;

    [SetUp]
    public void Setup()
    {
        Page = new LoginPage(null!);
    }

    [TearDown]
    public void TearDown()
    {
        Page?.Dispose();
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
    public void Dispose() { }
}
