using NUnit.Framework;

[TestFixture]
public class FailWithTicketCommentTests
{
    [Test]
    public void KnownFailure()
    {
        Assert.Fail(); // PROJ-999 regression
    }
}
