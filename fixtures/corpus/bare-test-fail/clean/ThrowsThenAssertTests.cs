using NUnit.Framework;

[TestFixture]
public class ThrowsThenAssertTests
{
    [Test]
    public void ExpectsExceptionThenVerifies()
    {
        var ex = Assert.Throws<System.ArgumentException>(() => DoThing());
        Assert.That(ex.Message, Does.Contain("invalid"));
    }

    private void DoThing() => throw new System.ArgumentException("invalid");
}
