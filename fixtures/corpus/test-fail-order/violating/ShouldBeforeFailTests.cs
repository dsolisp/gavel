using NUnit.Framework;

[TestFixture]
public class ShouldBeforeFailTests
{
    [Test]
    public void FluentThenFail()
    {
        var result = 42;
        result.Should().Be(42);
        Assert.Fail();
    }
}
