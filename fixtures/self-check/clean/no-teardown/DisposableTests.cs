using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class DisposableTests : IDisposable
{
    [Test]
    public void CreateOrder()
    {
        var client = new HttpClient();
        client.PostAsync("/orders", null);
    }

    public void Dispose()
    {
    }
}
