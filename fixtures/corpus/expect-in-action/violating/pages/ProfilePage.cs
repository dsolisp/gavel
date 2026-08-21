using NUnit.Framework;

namespace Gavel.Fixtures.Pages;

public class ProfilePage
{
    private readonly IPage _page;
    public ProfilePage(IPage page) => _page = page;

    public void CheckName()
    {
        Assert.That("John", Is.EqualTo("John"));
    }
}
