using NUnit.Framework;

[TestFixture]
public class ThrowsWithShouldTests
{
    [Test]
    public void ExpectsExceptionWithFluentAssert()
    {
        var ex = Assert.Throws<System.Exception>(() => DoThing());
        ex.Should().BeOfType<System.Exception>();
    }

    private void DoThing() => throw new System.Exception();
}
