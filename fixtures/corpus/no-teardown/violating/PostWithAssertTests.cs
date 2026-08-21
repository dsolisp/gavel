using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PostWithAssertTests
{
    [Test]
    public async Task CreateAndVerify()
    {
        var client = new HttpClient();
        var response = await client.PostAsync("/items", null);
        Assert.That(response.IsSuccessStatusCode);
    }
}
