using NUnit.Framework;

[TestFixture]
public class FailWithBugRefTests
{
    [Test]
    public void KnownFailure()
    {
        Assert.Fail("BUG-123: not implemented");
    }
}
