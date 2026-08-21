using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class MstestDirectTests
{
    [TestCaseSource(nameof(GetData))]
    public void Order_ConstructsPageDirectly(string data)
    {
        var orderPage = new OrderPage(null!);
        orderPage.Submit();
    }

    private static IEnumerable<string> GetData() => new[] { "x" };
}

public class OrderPage
{
    public OrderPage(IPage page) { }
    public void Submit() { }
}
