using NUnit.Framework;

[TestFixture]
public class BareAssertThrowsTests
{
    [Test]
    public void ExpectsException()
    {
        Assert.Throws<System.Exception>(() => DoThing());
    }

    private void DoThing() { }
}
