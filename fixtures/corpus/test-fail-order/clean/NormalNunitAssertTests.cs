using NUnit.Framework;

[TestFixture]
public class NormalNunitAssertTests
{
    [Test]
    public void SimpleAssert()
    {
        Assert.That(true, Is.True);
    }
}
