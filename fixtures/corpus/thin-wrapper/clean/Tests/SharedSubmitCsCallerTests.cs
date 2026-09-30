using NUnit.Framework;

namespace ThinWrapperCorpus.Clean.Tests;

public class SharedSubmitCsCallerTests
{
    [Test]
    public async System.Threading.Tasks.Task CallsSharedCsTwice()
    {
        var page = new ThinWrapperCorpus.Clean.Pages.Shared.SharedSubmitCsPage(null!);
        await page.SharedSubmitCsAsync();
        await page.SharedSubmitCsAsync();
    }
}
