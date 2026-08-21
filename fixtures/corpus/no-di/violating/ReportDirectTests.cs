using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ReportDirectTests
{
    [Test]
    public void Report_ConstructsPageDirectly()
    {
        var reportPage = new ReportPage(null!);
        reportPage.Generate();
    }
}

public class ReportPage
{
    public ReportPage(IPage page) { }
    public void Generate() { }
}
