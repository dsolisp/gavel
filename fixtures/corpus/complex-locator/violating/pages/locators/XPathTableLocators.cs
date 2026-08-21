public class XPathTableLocators
{
    public static ILocator FirstRowCell(IPage page) =>
        page.Locator("//table//tr[1]//td[2]");
}
