using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class TestFixturePatternTests
{
    private IPage _page;
    private SettingsPage _settingsPage;

    [OneTimeSetUp]
    public void OneTimeSetup()
    {
        _settingsPage = new SettingsPage(_page);
    }

    [Test]
    public void Settings_ToggleTheme()
    {
        _settingsPage.ToggleDarkMode();
    }
}

public class SettingsPage
{
    public SettingsPage(IPage page) { }
    public void ToggleDarkMode() { }
}
