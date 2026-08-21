using NUnit.Framework;

[TestFixture]
public class FailAfterSetupTests
{
    [SetUp]
    public void Setup() { }

    [Test]
    public void NotImplemented()
    {
        Assert.Fail();
    }
}
