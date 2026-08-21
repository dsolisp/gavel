using Microsoft.Playwright;

namespace AuditFixCs.Pages;

public class UnusedPage
{
    private readonly IPage _page;

    public UnusedPage(IPage page) => _page = page;

    public async Task OpenAsync() => await _page.GotoAsync("/unused");
}
