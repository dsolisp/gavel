using NUnit.Framework;

[TestFixture]
public class GetOnlyTests
{
    [Test]
    public async Task GetItem()
    {
        var client = new System.Net.Http.HttpClient();
        await client.GetAsync("/items/1");
    }
}
