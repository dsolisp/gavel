using NUnit.Framework;

namespace Gavel.Fixtures;

public class TaggedIgnoreTests
{
    // gavel-ignore: no-di — PROJ-123 fixture wiring pending
    [Test]
    public void UsesTaggedSuppression()
    {
        Assert.Pass();
    }
}
