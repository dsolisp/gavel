using NUnit.Framework;

[TestFixture]
public class UnorderedTests
{
    [Test]
    public void First()
    {
        Assert.That(1, Is.EqualTo(1));
    }

    [Test]
    public void Second()
    {
        Assert.That(2, Is.EqualTo(2));
    }

    [Test]
    public void Third()
    {
        Assert.That(3, Is.EqualTo(3));
    }
}
