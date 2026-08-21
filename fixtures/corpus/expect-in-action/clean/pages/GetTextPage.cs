namespace Gavel.Fixtures.Pages;

public class GetTextPage
{
    private readonly IPage _page;
    public GetTextPage(IPage page) => _page = page;

    public async Task<string> GetHeading()
    {
        return await _page.InnerTextAsync("h1");
    }
}
