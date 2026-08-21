using NUnit.Framework;

[TestFixture]
public class CleanNunitAssertTests
{
    [Test]
    public void NormalAssertion()
    {
        Assert.That(1 + 1, Is.EqualTo(2));
    }
}
