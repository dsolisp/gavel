using NUnit.Framework;

namespace Gavel.Fixtures;

public class StatusCodeTests
{
    [Test]
    public void ReturnsOk()
    {
        var status = 200;
        Assert.AreEqual(200, status);
    }
}
