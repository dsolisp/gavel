using Xunit;

public class TheoryNoOrderTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public void Parameterized(int value)
    {
        Assert.True(value > 0);
    }
}
