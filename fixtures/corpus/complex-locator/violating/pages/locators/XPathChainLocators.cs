public class XPathChainLocators
{
    public static ILocator ResultLink(IPage page) =>
        page.Locator("//div[@id='content']//span//a");
}
