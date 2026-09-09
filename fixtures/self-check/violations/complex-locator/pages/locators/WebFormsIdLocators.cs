public class WebFormsIdLocators
{
    public static ILocator AccountsDropdown(IPage page) =>
        page.Locator("#LEGACYAPP_cphContent_ddlAccounts");
}
