using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class MultiBeTests
{
    [Fact]
    public void ChainedMultiBeShadowsProse()
    {
        var message = "Payment rejected.";
        message.Should().Be("OK").And.Be("Payment rejected.");
    }
}
