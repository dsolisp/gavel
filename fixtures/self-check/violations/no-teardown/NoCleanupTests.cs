using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class NoCleanupTests
{
    [Test]
    public async Task CreateOrder()
    {
        var client = new HttpClient();
        await client.PostAsync("/orders", null);
    }
}
