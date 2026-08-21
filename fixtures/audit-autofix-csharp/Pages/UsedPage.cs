using Microsoft.Playwright;

namespace AuditFixCs.Pages;

public class UsedPage
{
    private readonly IPage _page;

    public UsedPage(IPage page) => _page = page;

    public async Task OpenAsync() => await _page.GotoAsync("/used");
}
