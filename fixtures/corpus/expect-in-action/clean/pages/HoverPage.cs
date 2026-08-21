namespace Gavel.Fixtures.Pages;

public class HoverPage
{
    private readonly IPage _page;
    public HoverPage(IPage page) => _page = page;

    public async Task HoverOverMenu()
    {
        await _page.HoverAsync("#menu");
    }
}
