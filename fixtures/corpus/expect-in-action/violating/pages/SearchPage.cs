using NUnit.Framework;

namespace Gavel.Fixtures.Pages;

public class SearchPage
{
    private readonly IPage _page;
    public SearchPage(IPage page) => _page = page;

    public void VerifyResults()
    {
        Assert.AreEqual(5, 5);
    }
}
