using Microsoft.Playwright;
using Xunit;

namespace Gavel.Fixtures;

public class XunitDirectTests
{
    [Fact]
    public void Profile_ConstructsPageDirectly()
    {
        var profilePage = new ProfilePage(null!);
        profilePage.UpdateName();
    }
}

public class ProfilePage
{
    public ProfilePage(IPage page) { }
    public void UpdateName() { }
}
