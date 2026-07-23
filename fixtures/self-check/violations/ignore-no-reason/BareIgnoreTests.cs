using NUnit.Framework;

namespace Gavel.Fixtures;

public class BareIgnoreTests
{
    // gavel-ignore
    [Test]
    public void Placeholder()
    {
        Assert.Pass();
    }
}
