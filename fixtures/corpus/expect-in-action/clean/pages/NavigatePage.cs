namespace Gavel.Fixtures.Pages;

public class NavigatePage
{
    private readonly IPage _page;
    public NavigatePage(IPage page) => _page = page;

    public async Task GoToUrl(string url)
    {
        await _page.GotoAsync(url);
    }
}
