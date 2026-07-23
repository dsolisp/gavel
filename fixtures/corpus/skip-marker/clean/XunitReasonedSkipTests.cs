using Xunit;

namespace Gavel.Fixtures;

public class XunitReasonedSkipTests
{
    [Fact(Skip = "PROJ-456: flaky under parallel run, tracked")]
    public void SkippedWithTicket()
    {
    }
}
