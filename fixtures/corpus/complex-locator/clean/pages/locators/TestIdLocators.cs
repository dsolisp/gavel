public class TestIdLocators
{
    public static ILocator Dashboard(IPage page) =>
        page.GetByTestId("dashboard");
}
