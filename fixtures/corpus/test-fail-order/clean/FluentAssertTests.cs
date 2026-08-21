using NUnit.Framework;

[TestFixture]
public class FluentAssertTests
{
    [Test]
    public void FluentOnly()
    {
        var x = 42;
        x.Should().Be(42);
    }
}
