using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class PutWithTearDownTests
{
    [TearDown]
    public void Cleanup()
    {
        // DELETE FROM items WHERE id = @id
    }

    [Test]
    public async Task UpdateItem()
    {
        var client = new HttpClient();
        await client.PutAsync("/items/1", null);
    }
}
