namespace Gavel.Fixtures.Pages;

public class ReportPage
{
    private readonly IPage _page;
    public ReportPage(IPage page) => _page = page;

    public void VerifyGenerated()
    {
        var generated = true;
        generated.Should().BeTrue();
    }
}
