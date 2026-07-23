using Xunit;

namespace Gavel.Fixtures;

public class XunitReasonedSkipTests
{
    [Fact(Skip = "TIC-456: flaky under parallel run, tracked")]
    public void SkippedWithTicket()
    {
    }
}
