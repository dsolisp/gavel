using System.Net.Http;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class HardcodedUrlTests
{
    [Test]
    public void ConnectsToStagingHost()
    {
        var client = new HttpClient { BaseAddress = new Uri("https://staging.example.com:8443/") };
    }
}
