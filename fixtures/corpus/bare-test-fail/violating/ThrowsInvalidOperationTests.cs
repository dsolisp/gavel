using NUnit.Framework;

[TestFixture]
public class ThrowsInvalidOperationTests
{
    [Test]
    public void ExpectsInvalidOperation()
    {
        Assert.Throws<System.InvalidOperationException>(() => DoThing());
    }

    private void DoThing() { }
}
