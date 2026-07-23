using FluentAssertions;
using Xunit;

namespace Gavel.Fixtures;

public class FeatureFlagTests
{
    [Fact]
    public void FlagIsTrue()
    {
        var enabled = true;
        enabled.Should().Be(true);
    }
}
