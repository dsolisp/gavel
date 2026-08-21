namespace Gavel.Fixtures.Pages;

public class FormFillPage
{
    private readonly IPage _page;
    public FormFillPage(IPage page) => _page = page;

    public async Task FillName(string name)
    {
        await _page.FillAsync("#name", name);
    }
}
