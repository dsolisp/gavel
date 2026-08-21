public class TitleLocators
{
    public static ILocator SettingsHeader(IPage page) =>
        page.GetByTitle("Settings");
}
