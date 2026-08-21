using NUnit.Framework;

[TestFixture]
public class TicketedAssertFailTests
{
    [Test]
    public void KnownRegression()
    {
        Assert.Fail("PROJ-123: known bug");
    }
}
