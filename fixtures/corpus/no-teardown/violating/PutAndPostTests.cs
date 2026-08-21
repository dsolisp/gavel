using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PutAndPostTests
{
    [Test]
    public async Task CreateAndUpdate()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
        await client.PutAsync("/items/1", null);
    }
}
