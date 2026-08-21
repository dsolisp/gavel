using NUnit.Framework;

[TestFixture]
public class AssertFailAfterTwoAssertsTests
{
    [Test]
    public void TwoAssertsThenFail()
    {
        Assert.That(true, Is.True);
        Assert.AreEqual(1, 1);
        Assert.Fail("not done");
    }
}
