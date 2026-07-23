using NUnit.Framework;

namespace Gavel.Fixtures;

public class AreEqualMessageTests
{
    [Test]
    public void CountMatchesWithProseMessage()
    {
        var actual = 2;
        Assert.AreEqual(2, actual, "Payment count mismatch.");
    }
}
