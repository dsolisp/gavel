using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Net.Http;

[TestClass]
public class PostMstestTests
{
    [TestMethod]
    public async Task CreateItem()
    {
        var client = new HttpClient();
        await client.PostAsync("/items", null);
    }
}
