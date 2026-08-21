namespace Gavel.Fixtures.Pages;

public class UploadPage
{
    private readonly IPage _page;
    public UploadPage(IPage page) => _page = page;

    public async Task UploadFile(string path)
    {
        await _page.SetInputFilesAsync("input[type='file']", path);
    }
}
