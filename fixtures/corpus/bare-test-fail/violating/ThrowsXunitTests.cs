using Xunit;

public class ThrowsXunitTests
{
    [Fact]
    public void ExpectsException()
    {
        Assert.Throws<System.ArgumentException>(() => DoThing());
    }

    private void DoThing() { }
}
