using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class SettingsDirectTests
{
    [Test]
    public void Settings_ConstructsActionsDirectly()
    {
        var settingsActions = new SettingsActions(null!);
        settingsActions.ToggleNotifications();
    }
}

public class SettingsActions
{
    public SettingsActions(IPage page) { }
    public void ToggleNotifications() { }
}
