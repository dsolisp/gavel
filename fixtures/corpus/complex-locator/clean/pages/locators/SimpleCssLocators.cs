public class SimpleCssLocators
{
    public static ILocator SubmitButton(IPage page) =>
        page.Locator("#submit");
}
