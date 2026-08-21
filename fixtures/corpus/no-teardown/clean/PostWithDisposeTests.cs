using Xunit;
using System.Net.Http;

public class PostWithDisposeTests : IAsyncDisposable
{
    public ValueTask DisposeAsync()
    {
        return ValueTask.CompletedTask;
    }

    [Fact]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
