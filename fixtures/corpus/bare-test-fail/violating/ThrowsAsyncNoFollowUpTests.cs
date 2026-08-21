using NUnit.Framework;

[TestFixture]
public class ThrowsAsyncNoFollowUpTests
{
    [Test]
    public void ExpectsAsyncException()
    {
        Assert.ThrowsAsync<System.Exception>(async () => await DoThingAsync());
    }

    private System.Threading.Tasks.Task DoThingAsync() => System.Threading.Tasks.Task.CompletedTask;
}
