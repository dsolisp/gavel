using NUnit.Framework;

[TestFixture]
public class ThrowsWithFollowUpTests
{
    [Test]
    public void ExpectsExceptionAndVerifies()
    {
        var ex = Assert.Throws<System.InvalidOperationException>(() => DoThing());
        Assert.That(ex!.Message, Is.EqualTo("boom"));
    }

    private void DoThing() => throw new System.InvalidOperationException("boom");
}
