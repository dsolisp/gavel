using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class TearDownTests
{
    [TearDown]
    public void Cleanup()
    {
        // DELETE FROM orders WHERE id = @lastId
    }

    [Test]
    public void CreateOrder()
    {
        var client = new HttpClient();
        client.PostAsync("/orders", null);
    }
}
