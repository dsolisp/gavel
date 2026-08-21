public class XpathPrefixLocators
{
    public static ILocator ResultItem(IPage page) =>
        page.Locator("xpath=//div[@class='result']");
}
