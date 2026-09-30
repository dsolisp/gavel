using Microsoft.Playwright;

namespace AuditFixCs.Pages.Locators;

public class LoginLocators
{
    private readonly IPage _page;

    public LoginLocators(IPage page) => _page = page;

    public ILocator UsedButton => _page.GetByRole(AriaRole.Button, new() { Name = "Used" });

    public ILocator TableRows => _page.Locator("tr");

    public ILocator NestedUsedButton => TableRows.Nth(0).GetByRole(AriaRole.Button, new() { Name = "Nested used" });

    public ILocator UnusedButton => _page.GetByRole(AriaRole.Button, new() { Name = "Unused" });
}
