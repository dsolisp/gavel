using NUnit.Framework;

[TestFixture]
public class TearDownOnlyTests
{
    [TearDown]
    public void Cleanup() { }

    [Test]
    public void SimpleTest()
    {
        Assert.That(1 + 1, Is.EqualTo(2));
    }
}
