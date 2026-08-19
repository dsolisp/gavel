using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

// Infrastructure base class — Gate 1 skips no-di for *TestsBase.cs basenames.
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
