using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class OneTimeTearDownTests
{
    [OneTimeTearDown]
    public void CleanupAll()
    {
        // cleanup after all tests
    }

    [Test]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
