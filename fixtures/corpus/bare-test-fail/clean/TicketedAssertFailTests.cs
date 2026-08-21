using NUnit.Framework;

[TestFixture]
public class TicketedAssertFailTests
{
    [Test]
    public void KnownRegression()
    {
        Assert.Fail("PROJ-1: known regression");
    }
}
