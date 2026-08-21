using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PostAsyncWithContentTests
{
    [Test]
    public async Task CreateWithContent()
    {
        var client = new HttpClient();
        var content = new StringContent("{}");
        await client.PostAsync("/api/data", content);
    }
}
