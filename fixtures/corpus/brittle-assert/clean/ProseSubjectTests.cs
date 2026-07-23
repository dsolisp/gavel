using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class ProseSubjectTests
{
    [Fact]
    public void ProseSubjectWithIdentifierExpected()
    {
        var actual = ComputeMessage();
        "Payment rejected.".Should().Be(actual);
    }
}
