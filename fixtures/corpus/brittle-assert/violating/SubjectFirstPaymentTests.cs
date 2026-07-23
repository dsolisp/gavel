using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class SubjectFirstPaymentTests
{
    [Fact]
    public void RejectionMessageMatches()
    {
        "rejected".Should().Be("Your payment was rejected.");
    }
}
