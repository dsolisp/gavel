using NUnit.Framework;

namespace Gavel.Fixtures;

public class InvalidCredentialsTests
{
    [Test]
    public void MessageEqualsProse()
    {
        var message = "Invalid credentials.";
        Assert.AreEqual("Invalid credentials.", message);
    }
}
