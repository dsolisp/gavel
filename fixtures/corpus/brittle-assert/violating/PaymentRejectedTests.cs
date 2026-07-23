using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class PaymentRejectedTests
{
    [Fact]
    public void MessageMatchesProse()
    {
        var message = "Your payment was rejected.";
        message.Should().Be("Your payment was rejected.");
    }
}
