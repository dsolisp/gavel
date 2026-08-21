using NUnit.Framework;

[TestFixture]
public class MultipleTestNoFailTests
{
    [Test]
    public void Test1()
    {
        Assert.That(1, Is.EqualTo(1));
    }

    [Test]
    public void Test2()
    {
        Assert.That("a", Is.EqualTo("a"));
    }

    [Test]
    public void Test3()
    {
        Assert.That(true, Is.True);
    }
}
