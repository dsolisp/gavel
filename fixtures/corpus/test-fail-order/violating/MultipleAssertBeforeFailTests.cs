using NUnit.Framework;

[TestFixture]
public class MultipleAssertBeforeFailTests
{
    [Test]
    public void ManyAssertsThenFail()
    {
        Assert.That(1, Is.EqualTo(1));
        Assert.That(2, Is.EqualTo(2));
        Assert.That(3, Is.EqualTo(3));
        Assert.Fail();
    }
}
