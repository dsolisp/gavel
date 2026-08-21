namespace Gavel.Fixtures.Pages;

public class HomeNavigationPage
{
    private readonly IPage _page;
    public HomeNavigationPage(IPage page) => _page = page;

    public async Task GoToDashboard()
    {
        await _page.ClickAsync("nav >> text=Dashboard");
    }
}
