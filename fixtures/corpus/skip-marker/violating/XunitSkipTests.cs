using Xunit;

namespace Gavel.Fixtures;

public class XunitSkipTests
{
    [Fact(Skip = "temporarily off")]
    public void SkippedWithoutTicket()
    {
    }
}
