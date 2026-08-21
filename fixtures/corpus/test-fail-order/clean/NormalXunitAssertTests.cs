using Xunit;

public class NormalXunitAssertTests
{
    [Fact]
    public void SimpleAssert()
    {
        Assert.Equal(42, 42);
    }
}
