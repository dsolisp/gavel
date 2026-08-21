public class AltTextLocators
{
    public static ILocator Logo(IPage page) =>
        page.GetByAltText("Company Logo");
}
