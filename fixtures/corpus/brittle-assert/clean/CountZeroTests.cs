using NUnit.Framework;

namespace Gavel.Fixtures;

public class CountZeroTests
{
    [Test]
    public void CountIsZero()
    {
        var count = 0;
        Assert.That(count, Is.EqualTo(0));
    }
}
