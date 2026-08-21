using NUnit.Framework;

[TestFixture]
public class TicketedThrowsTests
{
    [Test]
    public void ExpectsException()
    {
        // BUG-42: known issue
        Assert.Throws<System.Exception>(() => DoThing());
    }

    private void DoThing() { }
}
