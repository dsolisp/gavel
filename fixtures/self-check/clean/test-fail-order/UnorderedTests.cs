using NUnit.Framework;
using System.Net.Http;

[TestFixture]
public class UnorderedTests
{
    [Test]
    public void First()
    {
        var client = new HttpClient();
    }

    [Test]
    public void Second()
    {
        var client = new HttpClient();
    }
}
