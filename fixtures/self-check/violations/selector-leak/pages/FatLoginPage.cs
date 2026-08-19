public class FatLoginPage
{
    public static ILocator AccountsDropdown(IPage page) =>
        page.Locator("#cphContenidoPagina_ddlCuentas");

    public void Navigate() { }
}
