using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class TestCleanupMstestTests
{
    [TestCleanup]
    public void Cleanup()
    {
        // cleanup after each test
    }

    [Test]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
