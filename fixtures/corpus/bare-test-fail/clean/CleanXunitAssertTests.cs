using Xunit;

public class CleanXunitAssertTests
{
    [Fact]
    public void NormalAssertion()
    {
        Assert.Equal(42, 42);
    }
}
