using NUnit.Framework;

namespace ThinWrapper.Tests;

public class SharedSubmitCallerTests
{
    [Test]
    public async System.Threading.Tasks.Task CallsSharedTwice()
    {
        var page = new ThinWrapper.Pages.Shared.SharedSubmitPage(null!);
        await page.SharedSubmitAsync();
        await page.SharedSubmitAsync();
    }
}
