public class DeepXPathLocators
{
    public static ILocator NavItem(IPage page) =>
        page.Locator("//nav//ul//li//a[@class='active']");
}
