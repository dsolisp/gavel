using NUnit.Framework;
using System;

[TestFixture]
public class DisposableTests : IDisposable
{
    public void Dispose()
    {
        // cleanup
    }

    [Test]
    public void CreateItem()
    {
        var client = new System.Net.Http.HttpClient();
        client.PostAsync("/items", null);
    }
}
