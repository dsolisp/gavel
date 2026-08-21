public class XPathFormLocators
{
    public static ILocator LoginForm(IPage page) =>
        page.Locator("//form[@id='loginForm']");
}
