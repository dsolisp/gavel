public class WebFormsLabelLocators
{
    public static ILocator StatusLabel(IPage page) =>
        page.Locator("#ctl00_MainContent_lblStatus");
}
