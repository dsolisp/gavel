namespace Gavel.Fixtures.Pages;

public class WaitPage
{
    private readonly IPage _page;
    public WaitPage(IPage page) => _page = page;

    public async Task WaitForNavigation()
    {
        await _page.WaitForURLAsync("/dashboard");
    }
}
