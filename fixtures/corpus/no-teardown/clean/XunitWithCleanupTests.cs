using Xunit;
using System.Net.Http;

public class XunitWithCleanupTests : IDisposable
{
    public void Dispose()
    {
        // cleanup
    }

    [Fact]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
