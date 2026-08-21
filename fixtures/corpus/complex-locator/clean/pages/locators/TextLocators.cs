public class TextLocators
{
    public static ILocator WelcomeHeading(IPage page) =>
        page.GetByText("Welcome");
}
