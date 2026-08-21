using NUnit.Framework;

[TestFixture]
public class FailWithHashTicketTests
{
    [Test]
    public void KnownFailure()
    {
        Assert.Fail("#42");
    }
}
