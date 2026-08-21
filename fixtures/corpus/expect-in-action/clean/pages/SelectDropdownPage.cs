namespace Gavel.Fixtures.Pages;

public class SelectDropdownPage
{
    private readonly IPage _page;
    public SelectDropdownPage(IPage page) => _page = page;

    public async Task SelectOption(string value)
    {
        await _page.SelectOptionAsync("select#options", value);
    }
}
