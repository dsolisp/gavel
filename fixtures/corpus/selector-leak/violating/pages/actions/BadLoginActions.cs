using System.Threading.Tasks;
using Microsoft.Playwright;

namespace Gavel.Fixtures.Pages.Actions;

public class BadLoginActions
{
    public async Task ClickSave(IPage page)
    {
        await page.GetByRole(AriaRole.Button, new() { Name = "Save" }).ClickAsync();
    }
}
