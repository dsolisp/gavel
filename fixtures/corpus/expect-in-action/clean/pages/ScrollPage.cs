namespace Gavel.Fixtures.Pages;

public class ScrollPage
{
    private readonly IPage _page;
    public ScrollPage(IPage page) => _page = page;

    public async Task ScrollToBottom()
    {
        await _page.EvaluateAsync("window.scrollTo(0, document.body.scrollHeight)");
    }
}
