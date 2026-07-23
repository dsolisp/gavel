using NUnit.Framework;

namespace Gavel.Fixtures;

public class ReasonedSkipTests
{
    [Ignore("PROJ-123: upstream broker unavailable")]
    [Test]
    public void SkippedWithTicketReason()
    {
        Assert.Pass();
    }
}
