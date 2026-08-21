using NUnit.Framework;

[TestFixture]
public class AssertBeforeFailTests
{
    [Test]
    public void AssertThenFail()
    {
        Assert.That(1, Is.EqualTo(1));
        Assert.Fail("known regression");
    }
}
