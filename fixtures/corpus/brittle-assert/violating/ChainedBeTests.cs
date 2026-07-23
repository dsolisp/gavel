using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class ChainedBeTests
{
    [Fact]
    public void ChainedMatchOnProse()
    {
        var message = "Payment rejected.";
        message.Should().NotBeNull().And.Be("Payment rejected.");
    }
}
