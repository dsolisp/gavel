using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PostWithOneTimeSetUpTests
{
    [OneTimeSetUp]
    public void OneTimeSetup() { }

    [Test]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
