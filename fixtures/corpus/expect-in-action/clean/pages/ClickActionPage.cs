namespace Gavel.Fixtures.Pages;

public class ClickActionPage
{
    private readonly IPage _page;
    public ClickActionPage(IPage page) => _page = page;

    public async Task SubmitForm()
    {
        await _page.ClickAsync("button[type='submit']");
    }
}
