using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Net.Http;

[TestClass]
public class MstestWithCleanupTests
{
    [TestCleanup]
    public void Cleanup()
    {
        // cleanup
    }

    [TestMethod]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
