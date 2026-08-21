using Xunit;
using System.Net.Http;

public class PostXunitTests
{
    [Fact]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
