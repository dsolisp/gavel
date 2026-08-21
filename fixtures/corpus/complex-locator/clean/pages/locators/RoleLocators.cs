public class RoleLocators
{
    public static ILocator SubmitButton(IPage page) =>
        page.GetByRole(AriaRole.Button, new() { NameString = "Submit" });
}
