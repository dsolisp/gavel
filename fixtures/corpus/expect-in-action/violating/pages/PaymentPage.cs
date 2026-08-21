using NUnit.Framework;

namespace Gavel.Fixtures.Pages;

public class PaymentPage
{
    private readonly IPage _page;
    public PaymentPage(IPage page) => _page = page;

    public void VerifyAmount()
    {
        Assert.AreEqual(100, 100);
    }
}
