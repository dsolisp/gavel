public class WebFormsTextBoxLocators
{
    public static ILocator NameInput(IPage page) =>
        page.Locator("#frmMain_cphContent_txtName");
}
