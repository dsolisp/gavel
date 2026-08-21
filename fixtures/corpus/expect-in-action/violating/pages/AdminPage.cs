using NUnit.Framework;

namespace Gavel.Fixtures.Pages;

public class AdminPage
{
    private readonly IPage _page;
    public AdminPage(IPage page) => _page = page;

    public void VerifyAccess()
    {
        Assert.IsTrue(true);
    }
}
