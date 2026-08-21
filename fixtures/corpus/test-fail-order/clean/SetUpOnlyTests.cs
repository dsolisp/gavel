using NUnit.Framework;

[TestFixture]
public class SetUpOnlyTests
{
    [SetUp]
    public void Setup()
    {
        // initialization
    }

    [Test]
    public void UsesSetup()
    {
        Assert.That(true, Is.True);
    }
}
