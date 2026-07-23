using NUnit.Framework;

namespace Gavel.Fixtures;

public class UnreasonedSkipTests
{
    [Ignore]
    [Test]
    public void SkippedWithoutReason()
    {
        Assert.Pass();
    }
}
