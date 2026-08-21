public class PlaceholderLocators
{
    public static ILocator SearchInput(IPage page) =>
        page.GetByPlaceholder("Search...");
}
