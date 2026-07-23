using NUnit.Framework;

namespace Gavel.Fixtures;

public class ReasonedSkipTests
{
    [Ignore("TIC-123: upstream broker unavailable")]
    [Test]
    public void SkippedWithTicketReason()
    {
        Assert.Pass();
    }
}
