using NUnit.Framework;

[TestFixture]
public class NoStateCreationTests
{
    [Test]
    public void ReadOnlyTest()
    {
        Assert.That(1 + 1, Is.EqualTo(2));
    }
}
