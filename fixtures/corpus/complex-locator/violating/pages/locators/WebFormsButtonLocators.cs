public class WebFormsButtonLocators
{
    public static ILocator SubmitButton(IPage page) =>
        page.Locator("#aspnetForm_cphBody_btnSubmit");
}
