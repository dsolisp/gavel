using NUnit.Framework;

[TestFixture]
public class FailWithNonTicketRefTests
{
    [Test]
    public void FailsWithNonMatchingRef()
    {
        // see jira board
        Assert.Fail();
    }
}
