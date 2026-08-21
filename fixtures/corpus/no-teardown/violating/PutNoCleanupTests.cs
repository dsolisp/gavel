using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PutNoCleanupTests
{
    [Test]
    public async Task UpdateOrder()
    {
        var client = new HttpClient();
        await client.PutAsync("/orders/1", null);
    }
}
