using Xunit;

public class TicketedFailXunitTests
{
    [Fact]
    public void KnownFailure()
    {
        // KNOWN-BUG: JIRA-99
        Assert.Fail();
    }
}
