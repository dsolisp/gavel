using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PostWithSetUpTests
{
    [SetUp]
    public void Setup() { }

    [Test]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
