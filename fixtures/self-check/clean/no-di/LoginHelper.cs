using Microsoft.Playwright;

namespace Gavel.Fixtures;

// Non-test helper: must NOT match TEST_FILE_RE (*Test.cs / *Tests.cs).
// Contains the same construction pattern as the violating C# test so a
// misclassified helper would produce a false positive on clean fixtures.
public class LoginHelper
{
    public LoginPage Create(IPage page)
    {
        // new LoginPage in comment must stay ignored by findMatches:
        // new LoginPage(page);
        return new LoginPage(page);
    }
}

public class LoginPage
{
    public LoginPage(IPage page) { }
}
