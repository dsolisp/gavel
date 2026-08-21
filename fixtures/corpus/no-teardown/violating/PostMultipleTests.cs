using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PostMultipleTests
{
    [Test]
    public async Task CreateFirst()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }

    [Test]
    public async Task CreateSecond()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
