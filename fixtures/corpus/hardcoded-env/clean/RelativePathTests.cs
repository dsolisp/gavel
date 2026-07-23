using NUnit.Framework;

namespace Gavel.Fixtures;

public class RelativePathTests
{
    [Test]
    public void LoadsRelativeFixture()
    {
        var path = "./fixtures/data.json";
    }
}
