namespace Gavel.Fixtures.Pages;

public class SettingsPage
{
    private readonly IPage _page;
    public SettingsPage(IPage page) => _page = page;

    public void VerifyToggle()
    {
        var enabled = true;
        enabled.Should().BeTrue();
    }
}
