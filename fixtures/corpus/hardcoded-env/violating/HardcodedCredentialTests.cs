using NUnit.Framework;

namespace Gavel.Fixtures;

public class HardcodedCredentialTests
{
    [Test]
    public void UsesInlineApiKey()
    {
        var apiKey = "sk-live-0123456789abcdef";
    }
}
