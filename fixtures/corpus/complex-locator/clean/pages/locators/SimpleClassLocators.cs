public class SimpleClassLocators
{
    public static ILocator ActiveItem(IPage page) =>
        page.Locator(".active");
}
