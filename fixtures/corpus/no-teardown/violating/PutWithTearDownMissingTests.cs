using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PutWithTearDownMissingTests
{
    [SetUp]
    public void Setup() { }

    [Test]
    public async Task UpdateItem()
    {
        var client = new HttpClient();
        await client.PutAsync("/items/1", null);
    }
}
