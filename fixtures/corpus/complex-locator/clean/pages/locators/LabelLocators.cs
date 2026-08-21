public class LabelLocators
{
    public static ILocator EmailField(IPage page) =>
        page.GetByLabel("Email address");
}
