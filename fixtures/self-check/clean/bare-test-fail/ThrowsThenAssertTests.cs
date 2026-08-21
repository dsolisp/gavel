using NUnit.Framework;

[TestFixture]
public class ThrowsThenAssertTests
{
    [Test]
    public void ExpectsExceptionThenAsserts()
    {
        var ex = Assert.Throws<System.Exception>(() => DoThing());
        Assert.That(ex.Message, Does.Contain("error"));
    }

    private void DoThing() { throw new System.Exception("error"); }
}
